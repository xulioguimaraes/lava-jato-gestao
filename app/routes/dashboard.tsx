import { json, redirect } from "@remix-run/node";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { Link, useLoaderData, useSearchParams } from "@remix-run/react";
import { requererUsuario } from "~/utils/session.server";
import {
  listarLavagensSemana,
  calcularTotalSemana,
  obterInfoSemana,
} from "~/utils/lavagens.server";
import { formatDatePtBr } from "~/utils/date";
import { ResumoSemanal } from "~/components/ResumoSemanal";
import { DesempenhoFuncionarios } from "~/components/DesempenhoFuncionarios";
import { DespesasRecentes } from "~/components/DespesasRecentes";
import { LavagensRecentes } from "~/components/LavagensRecentes";
import { ResumoCards } from "~/components/ResumoCards";
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

export const meta: MetaFunction = () => [
  { title: pageTitle("Dashboard") },
  { name: "description", content: "Painel administrativo - X Lava Jato" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const usuario = await requererUsuario(request);

  // Obter offset da semana da query string (0 = semana atual, 1 = semana anterior, etc.)
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
  const porcentagens = new Map(
    funcionarios.map((f) => [f.id, f.porcentagem_comissao || 40])
  );
  const totalComissoes = lavagens.reduce((sum, l) => {
    const perc = porcentagens.get(l.funcionario_id) ?? 40;
    return sum + l.preco * (perc / 100);
  }, 0);

  return json({
    lavagens,
    totais,
    funcionarios,
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
        { status: 400 }
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
      // Se não enviou nova foto, manter a foto existente
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
      fotoUrl || ""
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

  // Fechar menu ao clicar fora
  useEffect(() => {
    if (!showUserMenu) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-user-menu]')) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showUserMenu]);

  // Função para navegar entre semanas
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
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-12 gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex items-center justify-center w-8 h-8 bg-indigo-600 rounded-lg text-white shadow-sm flex-shrink-0">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <rect x="2" y="2" width="5" height="5" rx="0.5" />
                  <rect x="9" y="2" width="5" height="5" rx="0.5" />
                  <rect x="2" y="9" width="5" height="5" rx="0.5" />
                  <rect x="9" y="9" width="5" height="5" rx="0.5" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base font-semibold text-slate-100 leading-none truncate">
                  {usuario.nome_negocio || "Lava Jato Gestão"}
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Painel Administrativo
                </p>
              </div>
            </div>
            <div className="relative flex-shrink-0" data-user-menu>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Menu do usuário"
              >
                <svg
                  className="w-5 h-5 text-slate-300"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-lg py-1 z-20">
                  <Link
                    to={`/${usuarioSlug || "publico"}`}
                    onClick={() => setShowUserMenu(false)}
                    className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-indigo-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                      </svg>
                      <span>Página Pública</span>
                    </div>
                  </Link>
                  <Form method="post">
                    <input type="hidden" name="intent" value="logout" />
                    <button
                      type="submit"
                      className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4 text-slate-400"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M6 12l-4-4 4-4M2 8h12" />
                      </svg>
                      <span>Sair</span>
                    </button>
                  </Form>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
        {showToast && (
          <Toast
            message="Despesa atualizada com sucesso!"
            onClose={() => setShowToast(false)}
          />
        )}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">
            Visão Geral
          </h2>
          <p className="text-sm text-slate-400">
            Acompanhe o desempenho desta semana.
          </p>
        </div>

        <ResumoCards
          offsetSemana={offsetSemana}
          infoSemana={infoSemana}
          navegarSemana={navegarSemana}
          totalReceita={totais.total}
          totalLavagens={lavagens.length}
          totalFuncionariosAtivos={funcionarios.filter((f) => f.ativo).length}
          totalDespesas={totalDespesas}
        />

        {/* Card de Lucro e Comissões */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="card p-3 hover:border-emerald-500 transition-colors">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  lucroLiquido >= 0 ? "bg-emerald-900/30" : "bg-amber-900/30"
                }`}
              >
                <svg
                  className={`w-6 h-6 ${
                    lucroLiquido >= 0 ? "text-emerald-400" : "text-amber-400"
                  }`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M3 3h14v14H3V3zm1 1v12h12V4H4zm2 2h8v1H6V6zm0 3h8v1H6V9zm0 3h5v1H6v-1z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xs font-medium text-slate-400">
                  Lucro Líquido da Semana
                </h3>
                <p
                  className={`text-xl font-bold mt-0.5 ${
                    lucroLiquido >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  R$ {lucroLiquido.toFixed(2).replace(".", ",")}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Receitas: R$ {totais.total.toFixed(2).replace(".", ",")} •
                  Despesas: R$ {totalDespesas.toFixed(2).replace(".", ",")}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-3 hover:border-amber-500 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-900/30 rounded-lg">
                <svg
                  className="w-6 h-6 text-amber-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm-.5 4a.5.5 0 011 0v3.5H14a.5.5 0 010 1h-3.5V14a.5.5 0 01-1 0v-3.5H6a.5.5 0 010-1h3.5V6z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xs font-medium text-slate-400">
                  Comissões a Pagar (semana)
                </h3>
                <p className="text-xl font-bold text-amber-300 mt-0.5">
                  R$ {totalComissoes.toFixed(2).replace(".", ",")}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Calculado com a porcentagem de comissão de cada funcionário.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <LavagensRecentes lavagens={lavagens} />

          <DespesasRecentes
            despesas={despesas}
            editingDespesaId={editingDespesaId}
            setEditingDespesaId={setEditingDespesaId}
          />
        </div>

        <DesempenhoFuncionarios
          itens={totais.porFuncionario}
          funcionarios={funcionarios}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          <div className="lg:col-span-1">
            <ResumoSemanal lavagens={lavagens} despesas={despesas} />
          </div>
        </div>
      </div>
    </div>
  );
}
