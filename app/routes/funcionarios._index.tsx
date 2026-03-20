import { json } from "@remix-run/node";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useLoaderData, useSearchParams } from "@remix-run/react";
import { useEffect, useState } from "react";
import { requererUsuario } from "~/utils/session.server";
import { listarFuncionarios } from "~/utils/funcionarios.server";
import { obterInfoSemana } from "~/utils/lavagens.server";
import { pageTitle } from "~/utils/meta";
import { DashboardHeader } from "~/components/dashboard/DashboardHeader";
import { BottomNav } from "~/components/dashboard/BottomNav";

export const meta: MetaFunction = () => [
  { title: pageTitle("Equipe") },
  {
    name: "description",
    content: "Lista de funcionários - X Lava Jato",
  },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const usuario = await requererUsuario(request);
  const url = new URL(request.url);
  const offsetSemana = parseInt(url.searchParams.get("semana") || "0", 10) || 0;
  const [funcionarios, infoSemana] = await Promise.all([
    listarFuncionarios(usuario.id),
    Promise.resolve(obterInfoSemana(offsetSemana)),
  ]);
  return json({
    funcionarios,
    usuario,
    usuarioSlug: usuario.slug || "",
    offsetSemana,
    infoSemana,
  });
}

export default function EquipePage() {
  const { funcionarios, usuario, usuarioSlug, offsetSemana, infoSemana } =
    useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navegarSemana = (novoOffset: number) => {
    const params = new URLSearchParams(searchParams);
    if (novoOffset === 0) params.delete("semana");
    else params.set("semana", novoOffset.toString());
    setSearchParams(params);
  };

  useEffect(() => {
    if (!showUserMenu) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-user-menu]")) setShowUserMenu(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showUserMenu]);

  const ativos = funcionarios.filter((f) => f.ativo);
  const inativos = funcionarios.filter((f) => !f.ativo);

  const [accordionAtivos, setAccordionAtivos] = useState(true);
  const [accordionInativos, setAccordionInativos] = useState(false);

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
        <div className="flex items-center justify-between mb-4">
          <p
            className="font-mono-app text-xs"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            {funcionarios.length} funcionário
            {funcionarios.length !== 1 ? "s" : ""} cadastrado
            {funcionarios.length !== 1 ? "s" : ""}
          </p>
          <Link
            to="/funcionarios/novo"
            className="font-mono-app text-xs py-1.5 px-3 rounded-lg"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.9)",
            }}
          >
            + Novo Funcionário
          </Link>
        </div>

        <div className="space-y-4">
          {ativos.length > 0 && (
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <button
                type="button"
                onClick={() => setAccordionAtivos(!accordionAtivos)}
                className="w-full px-4 py-3 flex items-center justify-between font-mono-app text-sm font-semibold text-left transition-colors hover:bg-white/5"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                <span className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: "var(--color-accent)" }}
                  />
                  Ativos ({ativos.length})
                </span>
                <svg
                  className={`w-4 h-4 transition-transform ${
                    accordionAtivos ? "rotate-180" : ""
                  }`}
                  style={{ color: "rgba(255,255,255,0.4)" }}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {accordionAtivos && (
                <div
                  className="px-4 pb-4 pt-0 space-y-2"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                >
                  {ativos.map((funcionario) => (
                    <Link
                      key={funcionario.id}
                      to={`/funcionarios/${funcionario.id}`}
                      className="flex items-center justify-between p-3 rounded-lg transition-colors group hover:bg-white/5"
                      style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: "rgba(34,197,94,0.15)" }}
                        >
                          <svg
                            className="w-5 h-5"
                            style={{ color: "rgba(34,197,94,0.9)" }}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div>
                          <p
                            className="font-mono-app font-medium group-hover:opacity-90"
                            style={{ color: "rgba(255,255,255,0.9)" }}
                          >
                            {funcionario.nome}
                          </p>
                          {funcionario.email && (
                            <p
                              className="font-mono-app text-xs"
                              style={{ color: "rgba(255,255,255,0.4)" }}
                            >
                              {funcionario.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <svg
                        className="w-4 h-4 opacity-50 group-hover:opacity-80 shrink-0"
                        style={{ color: "rgba(255,255,255,0.5)" }}
                        viewBox="0 0 16 16"
                        fill="currentColor"
                      >
                        <path d="M6 4l6 4-6 4V4z" />
                      </svg>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {inativos.length > 0 && (
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: "rgba(239,68,68,0.04)",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              <button
                type="button"
                onClick={() => setAccordionInativos(!accordionInativos)}
                className="w-full px-4 py-3 flex items-center justify-between font-mono-app text-sm font-semibold text-left transition-colors hover:bg-red-500/5"
                style={{ color: "rgba(239,68,68,0.95)" }}
              >
                <span className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: "rgba(239,68,68,0.9)" }}
                  />
                  Inativos ({inativos.length})
                </span>
                <svg
                  className={`w-4 h-4 transition-transform ${
                    accordionInativos ? "rotate-180" : ""
                  }`}
                  style={{ color: "rgba(239,68,68,0.7)" }}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {accordionInativos && (
                <div
                  className="px-4 pb-4 pt-0 space-y-2"
                  style={{ borderTop: "1px solid rgba(239,68,68,0.15)" }}
                >
                  {inativos.map((funcionario) => (
                    <Link
                      key={funcionario.id}
                      to={`/funcionarios/${funcionario.id}`}
                      className="flex items-center justify-between p-3 rounded-lg transition-colors group hover:bg-red-500/5"
                      style={{ border: "1px solid rgba(239,68,68,0.15)" }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: "rgba(239,68,68,0.15)" }}
                        >
                          <svg
                            className="w-5 h-5"
                            style={{ color: "rgba(239,68,68,0.9)" }}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div>
                          <p
                            className="font-mono-app font-medium group-hover:opacity-90"
                            style={{ color: "rgba(239,68,68,0.95)" }}
                          >
                            {funcionario.nome}
                          </p>
                          {funcionario.email && (
                            <p
                              className="font-mono-app text-xs"
                              style={{ color: "rgba(239,68,68,0.6)" }}
                            >
                              {funcionario.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <svg
                        className="w-4 h-4 opacity-50 group-hover:opacity-80 shrink-0"
                        style={{ color: "rgba(239,68,68,0.6)" }}
                        viewBox="0 0 16 16"
                        fill="currentColor"
                      >
                        <path d="M6 4l6 4-6 4V4z" />
                      </svg>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {funcionarios.length === 0 && (
            <div
              className="rounded-xl p-12 text-center"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <svg
                  className="w-6 h-6"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p
                className="font-mono-app text-sm mb-4"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                Nenhum funcionário cadastrado
              </p>
              <Link
                to="/funcionarios/novo"
                className="font-mono-app text-sm inline-flex py-2 px-4 rounded-lg"
                style={{
                  background: "var(--color-accent)",
                  color: "#0a0a0a",
                }}
              >
                + Adicionar primeiro funcionário
              </Link>
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
