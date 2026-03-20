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

export default function LavagensPage() {
  const { lavagens, offsetSemana, infoSemana, usuario, usuarioSlug } =
    useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtroDia, setFiltroDia] = useState<number | "todos">("todos");
  const [showUserMenu, setShowUserMenu] = useState(false);

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

  const lavagensFiltradas = useMemo(() => {
    if (filtroDia === "todos") return lavagens;
    return lavagens.filter((lavagem) => {
      const d = parseDateOnly(lavagem.data_lavagem);
      return d.getDay() === filtroDia;
    });
  }, [lavagens, filtroDia]);

  const totalFiltrado = useMemo(
    () => lavagensFiltradas.reduce((acc, l) => acc + l.preco, 0),
    [lavagensFiltradas],
  );

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

  const dias = [
    { label: "Dom", value: 0 },
    { label: "Seg", value: 1 },
    { label: "Ter", value: 2 },
    { label: "Qua", value: 3 },
    { label: "Qui", value: 4 },
    { label: "Sex", value: 5 },
    { label: "Sáb", value: 6 },
  ];

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
            className="px-5 py-3 flex flex-wrap gap-2"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            <button
              onClick={() => setFiltroDia("todos")}
              className={`text-xs px-3 py-1.5 rounded font-mono-app transition-colors ${
                filtroDia === "todos"
                  ? "bg-[#4D7C5F] text-[#0C0C0C]"
                  : "hover-item"
              }`}
              style={
                filtroDia !== "todos"
                  ? { border: "1px solid rgba(255,255,255,0.1)" }
                  : undefined
              }
            >
              Todos
            </button>
            {dias.map((dia) => (
              <button
                key={dia.value}
                onClick={() => setFiltroDia(dia.value)}
                className={`text-xs px-3 py-1.5 rounded font-mono-app transition-colors ${
                  filtroDia === dia.value
                    ? "bg-[#4D7C5F] text-[#0C0C0C]"
                    : "hover-item"
                }`}
                style={
                  filtroDia !== dia.value
                    ? { border: "1px solid rgba(255,255,255,0.1)" }
                    : undefined
                }
                title={`Filtrar por ${dia.label}`}
              >
                {dia.label}
              </button>
            ))}
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
                        {lavagem.forma_pagamento === "pix" ? "Pix" : "Dinheiro"}
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
