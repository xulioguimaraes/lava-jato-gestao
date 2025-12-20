import { json } from "@remix-run/node";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useLoaderData, useSearchParams } from "@remix-run/react";
import { useMemo, useState } from "react";
import { requererUsuario } from "~/utils/session.server";
import { listarDespesasSemana } from "~/utils/despesas.server";
import { obterInfoSemana } from "~/utils/lavagens.server";
import { formatDatePtBr, parseDateOnly } from "~/utils/date";
import { pageTitle } from "~/utils/meta";
import { Toast } from "~/components/Toast";

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

  return json({ despesas, offsetSemana, infoSemana });
}

export default function DespesasIndexPage() {
  const { despesas, offsetSemana, infoSemana } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtroDia, setFiltroDia] = useState<number | "todos">("todos");

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
    <div className="min-h-screen bg-slate-900">
      {mostrarToast && (
        <Toast
          message="Despesa registrada com sucesso!"
          onClose={fecharToast}
        />
      )}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center gap-2">
              <Link
                to="/dashboard"
                className="w-7 h-7 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors"
              >
                <svg
                  className="w-3.5 h-3.5 text-slate-400"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M10 12l-4-4 4-4" />
                </svg>
              </Link>
              <div className="flex flex-col gap-1">
                <h1 className="text-base font-semibold text-slate-100 leading-none">
                  Todas as Despesas
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
        {/* Filtro de Semana */}
        <div className="card p-3 mb-4">
          <div className="flex items-center flex-col md:flex-row justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navegarSemana(offsetSemana + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors"
                title="Semana anterior"
              >
                <svg
                  className="w-4 h-4 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div className="text-center min-w-[200px]">
                <p className="text-xs text-slate-400">Semana</p>
                <p className="text-sm font-medium text-slate-100">
                  {infoSemana.inicioFormatado} - {infoSemana.fimFormatado}
                </p>
              </div>
              <button
                onClick={() => navegarSemana(Math.max(0, offsetSemana - 1))}
                disabled={offsetSemana === 0}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Próxima semana"
              >
                <svg
                  className="w-4 h-4 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
            {offsetSemana > 0 && (
              <button
                onClick={() => navegarSemana(0)}
                className="text-xs text-indigo-400 hover:text-indigo-300"
              >
                Voltar para semana atual
              </button>
            )}
          </div>
        </div>

        <div className="card">
          <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50 flex items-center justify-between">
            <h2 className="font-semibold text-slate-100 text-sm">
              Despesas Registradas ({despesasFiltradas.length})
            </h2>
            <Link
              to="/despesas/novo"
              className="btn-secondary py-1 px-3 text-xs h-auto min-h-0"
            >
              + Nova Despesa
            </Link>
          </div>

          <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/30 flex flex-wrap gap-2">
            <button
              onClick={() => setFiltroDia("todos")}
              className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                filtroDia === "todos"
                  ? "bg-indigo-600 text-white border-indigo-500"
                  : "border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white"
              }`}
            >
              Todos
            </button>
            {dias.map((dia) => (
              <button
                key={dia.value}
                onClick={() => setFiltroDia(dia.value)}
                className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                  filtroDia === dia.value
                    ? "bg-indigo-600 text-white border-indigo-500"
                    : "border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white"
                }`}
                title={`Filtrar por ${dia.label}`}
              >
                {dia.label}
              </button>
            ))}
          </div>

          {despesas.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 text-sm">
                Nenhuma despesa cadastrada.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-800/50 text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-2 font-medium text-xs">Descrição</th>
                    <th className="px-4 py-2 font-medium text-xs text-right">
                      Valor
                    </th>
                    <th className="px-4 py-2 font-medium text-xs text-right">
                      Data
                    </th>
                    <th className="px-4 py-2 font-medium text-xs">
                      Observações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {despesasFiltradas.map((despesa) => (
                    <tr
                      key={despesa.id}
                      className="hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-4 py-2.5 text-slate-100 font-medium">
                        {despesa.descricao}
                      </td>
                      <td className="px-4 py-2.5 text-right text-red-300 font-semibold whitespace-nowrap">
                        - R$ {despesa.valor.toFixed(2).replace(".", ",")}
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-300 whitespace-nowrap">
                        {formatDatePtBr(despesa.data_despesa)}
                      </td>
                      <td className="px-4 py-2.5 text-slate-300">
                        {despesa.observacoes || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
