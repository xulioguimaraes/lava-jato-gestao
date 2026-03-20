import { json, redirect } from "@remix-run/node";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { requererUsuario } from "~/utils/session.server";
import {
  listarLavagensSemana,
  calcularTotalSemana,
  obterInfoSemana,
} from "~/utils/lavagens.server";
import { calcularValesPorFuncionariosSemana } from "~/utils/vales.server";
import { Toast } from "~/components/Toast";
import { listarFuncionarios } from "~/utils/funcionarios.server";
import { fazerLogout } from "~/utils/session.server";
import {
  listarDespesasSemana,
  calcularTotalDespesasSemana,
  atualizarDespesa,
  excluirDespesa,
  buscarDespesaPorId,
} from "~/utils/despesas.server";
import { Form } from "@remix-run/react";
import { useEffect, useState } from "react";
import { pageTitle } from "~/utils/meta";

import { DashboardHeader } from "~/components/dashboard/DashboardHeader";
import { KPIRow } from "~/components/dashboard/KPIRow";
import { LucroComissao } from "~/components/dashboard/LucroComissao";
import { WeekChart } from "~/components/dashboard/WeekChart";
import { LavagensList } from "~/components/dashboard/LavagensList";
import { FuncionariosList } from "~/components/dashboard/FuncionariosList";
import { DespesasRecentesDashboard } from "~/components/dashboard/DespesasRecentesDashboard";
import { BottomNav } from "~/components/dashboard/BottomNav";
import { FAB } from "~/components/dashboard/FAB";

export const meta: MetaFunction = () => [
  { title: pageTitle("Dashboard") },
  { name: "description", content: "Painel administrativo - X Lava Jato" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const usuario = await requererUsuario(request);

  const url = new URL(request.url);
  const offsetSemana = parseInt(url.searchParams.get("semana") || "0", 10) || 0;

  const [lavagens, totais, funcionarios, despesas, totalDespesas, infoSemana] =
    await Promise.all([
      listarLavagensSemana(offsetSemana, usuario.id),
      calcularTotalSemana(offsetSemana, usuario.id),
      listarFuncionarios(usuario.id),
      listarDespesasSemana(offsetSemana, usuario.id),
      calcularTotalDespesasSemana(offsetSemana, usuario.id),
      Promise.resolve(obterInfoSemana(offsetSemana)),
    ]);

  const lucroLiquido = totais.total - totalDespesas;
  const funcionariosAtivos = funcionarios.filter((f) => f.ativo);
  const porcentagens = new Map(
    funcionariosAtivos.map((f) => [f.id, f.porcentagem_comissao || 40]),
  );
  const totalComissoes = lavagens.reduce((sum, l) => {
    const perc = porcentagens.get(l.funcionario_id) ?? 40;
    return sum + l.preco * (perc / 100);
  }, 0);

  const funcionarioIds = totais.porFuncionario.map((p) => p.funcionario_id);
  const valesPorFuncionario = await calcularValesPorFuncionariosSemana(
    funcionarioIds,
    offsetSemana,
    usuario.id
  );

  const porFuncionarioComVales = totais.porFuncionario.map((p) => {
    const perc = porcentagens.get(p.funcionario_id) ?? 40;
    const comissao = p.total * (perc / 100);
    const totalVales = valesPorFuncionario[p.funcionario_id] ?? 0;
    const valorLiquido = comissao - totalVales;
    return {
      ...p,
      totalVales,
      comissao,
      valorLiquido,
    };
  });

  return json({
    lavagens,
    totais: { ...totais, porFuncionario: porFuncionarioComVales },
    funcionarios: funcionariosAtivos,
    despesas,
    totalDespesas,
    lucroLiquido,
    totalComissoes,
    offsetSemana,
    infoSemana,
    usuarioSlug: usuario.slug,
    usuario,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  await requererUsuario(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  const url = new URL(request.url);

  if (intent === "logout") {
    return fazerLogout(request);
  }

  if (intent === "updateDespesa") {
    const despesaId = formData.get("despesaId") as string;
    const descricao = formData.get("descricao") as string;
    const valor = formData.get("valor") as string;
    const dataDespesa = formData.get("data_despesa") as string;
    const observacoes = formData.get("observacoes") as string | null;
    const foto = formData.get("foto") as File | null;

    if (!descricao || !valor || !dataDespesa) {
      return json(
        { erro: "Descrição, valor e data são obrigatórios" },
        { status: 400 },
      );
    }

    const valorNum = parseFloat(valor);
    if (isNaN(valorNum) || valorNum <= 0) {
      return json({ erro: "Valor inválido" }, { status: 400 });
    }

    let fotoUrl: string | null = null;
    if (foto && foto.size > 0) {
      const arrayBuffer = await foto.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString("base64");
      fotoUrl = `data:${foto.type};base64,${base64}`;
    } else {
      const despesaExistente = await buscarDespesaPorId(despesaId);
      if (despesaExistente) {
        fotoUrl = despesaExistente.foto_url;
      }
    }

    await atualizarDespesa(
      despesaId,
      descricao,
      valorNum,
      dataDespesa,
      observacoes,
      fotoUrl || "",
    );
    url.searchParams.set("toast", "despesa");
    return redirect(`/dashboard?${url.searchParams.toString()}`);
  }

  if (intent === "deleteDespesa") {
    const despesaId = formData.get("despesaId") as string;
    await excluirDespesa(despesaId);
    url.searchParams.delete("toast");
    return redirect(`/dashboard?${url.searchParams.toString()}`);
  }

  return null;
}

export default function Dashboard() {
  const {
    lavagens,
    totais,
    funcionarios,
    despesas,
    totalDespesas,
    lucroLiquido,
    totalComissoes,
    offsetSemana,
    infoSemana,
    usuarioSlug,
    usuario,
  } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [editingDespesaId, setEditingDespesaId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const toastParam = searchParams.get("toast");
    if (toastParam === "despesa") {
      setShowToast(true);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("toast");
      setSearchParams(newParams, { replace: true });
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!showUserMenu) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-user-menu]")) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showUserMenu]);

  const navegarSemana = (novoOffset: number) => {
    const params = new URLSearchParams(searchParams);
    if (novoOffset === 0) {
      params.delete("semana");
    } else {
      params.set("semana", novoOffset.toString());
    }
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-deep pb-24 md:pb-8">
      {showToast && (
        <Toast
          message="Despesa atualizada com sucesso!"
          onClose={() => setShowToast(false)}
        />
      )}

      <DashboardHeader
        nomeNegocio={usuario.nome_negocio || "Lava Jato Gestão"}
        usuarioSlug={usuarioSlug || ""}
        offsetSemana={offsetSemana}
        infoSemana={infoSemana}
        navegarSemana={navegarSemana}
        showUserMenu={showUserMenu}
        setShowUserMenu={setShowUserMenu}
      />

      <main className="pt-20 px-4 max-w-[1200px] mx-auto space-y-4">
        <div className="mb-2">
          <h1 className="font-display font-extrabold text-xl tracking-tight">
            Visão Geral
          </h1>
          <p
            className="font-mono-app mt-1"
            style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}
          >
            Acompanhe o desempenho desta semana.
          </p>
        </div>

        <KPIRow
          totalReceita={totais.total}
          totalLavagens={lavagens.length}
          totalFuncionariosAtivos={funcionarios.length}
          totalDespesas={totalDespesas}
        />

        <LucroComissao
          lucroLiquido={lucroLiquido}
          totalReceita={totais.total}
          totalDespesas={totalDespesas}
          totalComissoes={totalComissoes}
        />

        <WeekChart lavagens={lavagens} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <LavagensList lavagens={lavagens} />
          <FuncionariosList
            itens={totais.porFuncionario}
            funcionarios={funcionarios}
          />
        </div>

        <DespesasRecentesDashboard
          despesas={despesas}
          editingDespesaId={editingDespesaId}
          setEditingDespesaId={setEditingDespesaId}
        />
      </main>

      <BottomNav />
      <FAB usuarioSlug={usuarioSlug ?? undefined} />
    </div>
  );
}
