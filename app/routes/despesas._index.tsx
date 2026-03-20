import { json } from "@remix-run/node";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useLoaderData, useSearchParams } from "@remix-run/react";
import { useEffect, useMemo, useState } from "react";
import { requererUsuario } from "~/utils/session.server";
import { listarDespesasSemana } from "~/utils/despesas.server";
import { obterInfoSemana } from "~/utils/lavagens.server";
import { formatDatePtBr, parseDateOnly } from "~/utils/date";
import { pageTitle } from "~/utils/meta";
import { Toast } from "~/components/Toast";
import { DashboardHeader } from "~/components/dashboard/DashboardHeader";
import { BottomNav } from "~/components/dashboard/BottomNav";

export const meta: MetaFunction = () => [
  { title: pageTitle("Despesas") },
  {
    name: "description",
    content: "Listagem completa de despesas - X Lava Jato",
  },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const usuario = await requererUsuario(request);

  // Obter offset da semana da query string (0 = semana atual, 1 = semana anterior, etc.)
  const url = new URL(request.url);
  const offsetSemana = parseInt(url.searchParams.get("semana") || "0", 10) || 0;

  const [despesas, infoSemana] = await Promise.all([
    listarDespesasSemana(offsetSemana, usuario.id),
    Promise.resolve(obterInfoSemana(offsetSemana)),
  ]);

  return json({
    despesas,
    offsetSemana,
    infoSemana,
    usuario,
    usuarioSlug: usuario.slug || "",
  });
}

export default function DespesasIndexPage() {
  const {
    despesas,
    offsetSemana,
    infoSemana,
    usuario,
    usuarioSlug,
  } = useLoaderData<typeof loader>();
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

  const despesasFiltradas = useMemo(() => {
    if (filtroDia === "todos") return despesas;
    return despesas.filter((despesa) => {
      const d = parseDateOnly(despesa.data_despesa);
      return d.getDay() === filtroDia;
    });
  }, [despesas, filtroDia]);

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

  const mostrarToast = searchParams.get("toast") === "ok";
  const fecharToast = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("toast");
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="min-h-screen bg-deep pb-24 md:pb-8">
      {mostrarToast && (
        <Toast
          message="Despesa registrada com sucesso!"
          onClose={fecharToast}
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
        {offsetSemana > 0 && (
          <button
            onClick={() => navegarSemana(0)}
            className="text-xs text-accent hover:opacity-80"
          >
            Voltar para semana atual
          </button>
        )}

        <div
          className="rounded-xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <h2 className="font-mono-app font-semibold text-sm">
              Despesas ({despesasFiltradas.length})
            </h2>
            <Link
              to="/despesas/novo"
              className="font-mono-app text-xs py-1.5 px-3 rounded-lg"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.9)",
              }}
            >
              + Nova Despesa
            </Link>
          </div>

          <div
            className="px-4 py-3 flex flex-wrap gap-2"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <button
              onClick={() => setFiltroDia("todos")}
              className={`font-mono-app text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                filtroDia === "todos"
                  ? "text-accent"
                  : ""
              }`}
              style={
                filtroDia === "todos"
                  ? { borderColor: "var(--color-accent)", color: "var(--color-accent)" }
                  : { borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }
              }
            >
              Todos
            </button>
            {dias.map((dia) => (
              <button
                key={dia.value}
                onClick={() => setFiltroDia(dia.value)}
                className={`font-mono-app text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  filtroDia === dia.value ? "" : ""
                }`}
                style={
                  filtroDia === dia.value
                    ? { borderColor: "var(--color-accent)", color: "var(--color-accent)" }
                    : { borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }
                }
                title={`Filtrar por ${dia.label}`}
              >
                {dia.label}
              </button>
            ))}
          </div>

          {despesas.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-mono-app text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                Nenhuma despesa cadastrada.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <th className="px-4 py-2 font-mono-app font-medium text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                      Descrição
                    </th>
                    <th className="px-4 py-2 font-mono-app font-medium text-xs text-right" style={{ color: "rgba(255,255,255,0.35)" }}>
                      Valor
                    </th>
                    <th className="px-4 py-2 font-mono-app font-medium text-xs text-right" style={{ color: "rgba(255,255,255,0.35)" }}>
                      Data
                    </th>
                    <th className="px-4 py-2 font-mono-app font-medium text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                      Observações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {despesasFiltradas.map((despesa) => (
                    <tr
                      key={despesa.id}
                      className="transition-colors hover:bg-white/5"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    >
                      <td className="px-4 py-2.5 font-mono-app font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>
                        {despesa.descricao}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono-app font-semibold whitespace-nowrap" style={{ color: "rgba(239,68,68,0.9)" }}>
                        - R$ {despesa.valor.toFixed(2).replace(".", ",")}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono-app whitespace-nowrap" style={{ color: "rgba(255,255,255,0.5)" }}>
                        {formatDatePtBr(despesa.data_despesa)}
                      </td>
                      <td className="px-4 py-2.5 font-mono-app" style={{ color: "rgba(255,255,255,0.5)" }}>
                        {despesa.observacoes || "-"}
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
