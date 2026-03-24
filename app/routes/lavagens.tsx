import { json } from "@remix-run/node";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useLoaderData, useSearchParams } from "@remix-run/react";
import { useEffect, useMemo, useState } from "react";
import { requererUsuario } from "~/utils/session.server";
import { listarLavagensSemana, obterInfoSemana } from "~/utils/lavagens.server";
import { formatDatePtBr, parseDateOnly } from "~/utils/date";
import { pageTitle } from "~/utils/meta";
import { DashboardHeader } from "~/components/dashboard/DashboardHeader";
import { BottomNav } from "~/components/dashboard/BottomNav";

export const meta: MetaFunction = () => [
  { title: pageTitle("Lavagens") },
  {
    name: "description",
    content: "Listagem completa de lavagens - X Lava Jato",
  },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const usuario = await requererUsuario(request);

  // Obter offset da semana da query string (0 = semana atual, 1 = semana anterior, etc.)
  const url = new URL(request.url);
  const offsetSemana = parseInt(url.searchParams.get("semana") || "0", 10) || 0;

  const [lavagens, infoSemana] = await Promise.all([
    listarLavagensSemana(offsetSemana, usuario.id),
    Promise.resolve(obterInfoSemana(offsetSemana)),
  ]);

  return json({
    lavagens,
    offsetSemana,
    infoSemana,
    usuario,
    usuarioSlug: usuario.slug || "",
  });
}

const dias = [
  { label: "Todos os dias", value: "todos" },
  { label: "Domingo", value: "0" },
  { label: "Segunda", value: "1" },
  { label: "Terça", value: "2" },
  { label: "Quarta", value: "3" },
  { label: "Quinta", value: "4" },
  { label: "Sexta", value: "5" },
  { label: "Sábado", value: "6" },
];

const formasPagamento = [
  { label: "Todas", value: "todos" },
  { label: "Pix", value: "pix" },
  { label: "Dinheiro", value: "dinheiro" },
  { label: "Cartão", value: "cartao" },
];

function getFiltrosFromParams(
  params: URLSearchParams
): { dia: number | "todos"; forma: string; funcionario: string } {
  const dia = params.get("dia");
  let diaVal: number | "todos" = "todos";
  if (dia !== null && dia !== "") {
    const n = parseInt(dia, 10);
    if (n >= 0 && n <= 6) diaVal = n;
  }

  const forma = params.get("forma");
  const formaVal = forma === "pix" || forma === "dinheiro" || forma === "cartao" ? forma : "todos";
  const funcionario = params.get("funcionario") ?? "todos";

  return { dia: diaVal, forma: formaVal, funcionario };
}

function applyFiltros<T extends { funcionario_id: string; forma_pagamento: string | null; data_lavagem: string }>(
  lavagens: T[],
  filtros: { dia: number | "todos"; forma: string; funcionario: string }
): T[] {
  return lavagens.filter((l) => {
    if (filtros.dia !== "todos") {
      const d = parseDateOnly(l.data_lavagem);
      if (d.getDay() !== filtros.dia) return false;
    }
    if (filtros.forma !== "todos" && l.forma_pagamento !== filtros.forma) return false;
    if (filtros.funcionario !== "todos" && l.funcionario_id !== filtros.funcionario)
      return false;
    return true;
  });
}

const inputStyle = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
};

export default function LavagensPage() {
  const { lavagens, offsetSemana, infoSemana, usuario, usuarioSlug } =
    useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtros, setFiltros] = useState(() => getFiltrosFromParams(searchParams));
  const [showUserMenu, setShowUserMenu] = useState(false);

  const funcionariosUnicos = useMemo(() => {
    const map = new Map<string, string>();
    lavagens.forEach((l) => {
      if (!map.has(l.funcionario_id)) map.set(l.funcionario_id, l.funcionario_nome);
    });
    return Array.from(map.entries()).map(([id, nome]) => ({ id, nome }));
  }, [lavagens]);

  useEffect(() => {
    setFiltros(getFiltrosFromParams(searchParams));
  }, [searchParams]);

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

  const lavagensFiltradas = useMemo(
    () => applyFiltros(lavagens, filtros),
    [lavagens, filtros]
  );

  const totalFiltrado = useMemo(
    () => lavagensFiltradas.reduce((acc, l) => acc + l.preco, 0),
    [lavagensFiltradas],
  );

  const atualizarFiltros = (updates: {
    dia?: number | "todos";
    forma?: string;
    funcionario?: string;
  }) => {
    const next = {
      dia: updates.dia !== undefined ? updates.dia : filtros.dia,
      forma: updates.forma !== undefined ? updates.forma : filtros.forma,
      funcionario:
        updates.funcionario !== undefined ? updates.funcionario : filtros.funcionario,
    };
    setFiltros(next);
    const params = new URLSearchParams(searchParams);
    if (next.dia === "todos") params.delete("dia");
    else params.set("dia", next.dia.toString());
    if (next.forma === "todos") params.delete("forma");
    else params.set("forma", next.forma);
    if (next.funcionario === "todos") params.delete("funcionario");
    else params.set("funcionario", next.funcionario);
    setSearchParams(params);
  };

  const navegarSemana = (novoOffset: number) => {
    const params = new URLSearchParams(searchParams);
    if (novoOffset === 0) params.delete("semana");
    else params.set("semana", novoOffset.toString());
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-deep pb-24 md:pb-8">
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
            Lavagens
          </h1>
          <p
            className="font-mono-app mt-1"
            style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}
          >
            Listagem completa de lavagens da semana
          </p>
        </div>

        <div
          className="bg-surface rounded-md"
          style={{ border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="px-5 pt-5 pb-3 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <p
                className="font-mono-app uppercase tracking-[0.12em]"
                style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)" }}
              >
                LAVAGENS REGISTRADAS ({lavagensFiltradas.length})
              </p>
              <p
                className="font-mono-app font-semibold"
                style={{
                  fontSize: "0.85rem",
                  color: "rgba(255,255,255,0.9)",
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                Total: R$ {totalFiltrado.toFixed(2).replace(".", ",")}
              </p>
            </div>
            <Link
              to={usuarioSlug ? `/${usuarioSlug}` : "/dashboard"}
              className="font-mono-app text-accent hover:opacity-80"
              style={{ fontSize: "0.65rem", color: "#4D7C5F" }}
            >
              Registrar nova
            </Link>
          </div>

          <div
            className="px-5 py-4 flex flex-wrap gap-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div className="flex flex-col gap-1">
              <label
                className="font-mono-app"
                style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.4)" }}
              >
                Dia
              </label>
              <select
                value={filtros.dia === "todos" ? "todos" : filtros.dia.toString()}
                onChange={(e) => {
                  const v = e.target.value;
                  atualizarFiltros({
                    dia: v === "todos" ? ("todos" as const) : parseInt(v, 10),
                  });
                }}
                className="font-mono-app text-sm px-3 py-2 rounded min-w-[140px]"
                style={inputStyle}
              >
                {dias.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label
                className="font-mono-app"
                style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.4)" }}
              >
                Forma de pagamento
              </label>
              <select
                value={filtros.forma}
                onChange={(e) => atualizarFiltros({ forma: e.target.value })}
                className="font-mono-app text-sm px-3 py-2 rounded min-w-[140px]"
                style={inputStyle}
              >
                {formasPagamento.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label
                className="font-mono-app"
                style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.4)" }}
              >
                Funcionário
              </label>
              <select
                value={filtros.funcionario}
                onChange={(e) => atualizarFiltros({ funcionario: e.target.value })}
                className="font-mono-app text-sm px-3 py-2 rounded min-w-[140px]"
                style={inputStyle}
              >
                <option value="todos">Todos</option>
                {funcionariosUnicos.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {lavagens.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p
                className="font-mono-app"
                style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.35)" }}
              >
                Nenhuma lavagem cadastrada.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <th
                      className="px-5 py-2 font-mono-app font-medium"
                      style={{
                        fontSize: "0.6rem",
                        color: "rgba(255,255,255,0.3)",
                      }}
                    >
                      Descrição
                    </th>
                    <th
                      className="px-5 py-2 font-mono-app font-medium text-right"
                      style={{
                        fontSize: "0.6rem",
                        color: "rgba(255,255,255,0.3)",
                      }}
                    >
                      Preço
                    </th>
                    <th
                      className="px-5 py-2 font-mono-app font-medium text-right"
                      style={{
                        fontSize: "0.6rem",
                        color: "rgba(255,255,255,0.3)",
                      }}
                    >
                      Data
                    </th>
                    <th
                      className="px-5 py-2 font-mono-app font-medium"
                      style={{
                        fontSize: "0.6rem",
                        color: "rgba(255,255,255,0.3)",
                      }}
                    >
                      Funcionário
                    </th>
                    <th
                      className="px-5 py-2 font-mono-app font-medium"
                      style={{
                        fontSize: "0.6rem",
                        color: "rgba(255,255,255,0.3)",
                      }}
                    >
                      Forma
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lavagensFiltradas.map((lavagem) => (
                    <tr
                      key={lavagem.id}
                      className="hover-item"
                      style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                    >
                      <td className="px-5 py-3 font-mono-app text-sm">
                        {lavagem.descricao}
                      </td>
                      <td
                        className="px-5 py-3 text-right font-semibold whitespace-nowrap"
                        style={{ fontFamily: "'Poppins', sans-serif" }}
                      >
                        R$ {lavagem.preco.toFixed(2).replace(".", ",")}
                      </td>
                      <td
                        className="px-5 py-3 text-right font-mono-app"
                        style={{
                          fontSize: "0.75rem",
                          color: "rgba(255,255,255,0.5)",
                        }}
                      >
                        {formatDatePtBr(lavagem.data_lavagem)}
                      </td>
                      <td
                        className="px-5 py-3 font-mono-app"
                        style={{
                          fontSize: "0.75rem",
                          color: "rgba(255,255,255,0.5)",
                        }}
                      >
                        {lavagem.funcionario_nome}
                      </td>
                      <td
                        className="px-5 py-3 font-mono-app uppercase"
                        style={{
                          fontSize: "0.65rem",
                          color: "rgba(255,255,255,0.4)",
                        }}
                      >
                        {lavagem.forma_pagamento === "pix" ? "Pix" : lavagem.forma_pagamento === "cartao" ? "Cartão" : "Dinheiro"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
