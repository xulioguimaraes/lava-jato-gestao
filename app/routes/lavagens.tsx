import { json } from "@remix-run/node";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useMemo, useState } from "react";
import { requererUsuario } from "~/utils/session.server";
import { listarTodasLavagens } from "~/utils/lavagens.server";
import { formatDatePtBr, parseDateOnly } from "~/utils/date";
import { pageTitle } from "~/utils/meta";

export const meta: MetaFunction = () => [
  { title: pageTitle("Lavagens") },
  {
    name: "description",
    content: "Listagem completa de lavagens - X Lava Jato",
  },
];

export async function loader({ request }: LoaderFunctionArgs) {
  await requererUsuario(request);
  const lavagens = await listarTodasLavagens();
  return json({ lavagens });
}

export default function LavagensPage() {
  const { lavagens } = useLoaderData<typeof loader>();
  const [filtroDia, setFiltroDia] = useState<number | "todos">("todos");

  const lavagensFiltradas = useMemo(() => {
    if (filtroDia === "todos") return lavagens;
    return lavagens.filter((lavagem) => {
      const d = parseDateOnly(lavagem.data_lavagem);
      return d.getDay() === filtroDia;
    });
  }, [lavagens, filtroDia]);

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
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center gap-3">
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
              <div>
                <h1 className="text-base font-semibold text-slate-100 leading-none">
                  Todas as Lavagens
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Histórico completo das lavagens registradas.
                </p>
              </div>
            </div>
            <Link
              to="/dashboard"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Voltar ao Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
        <div className="card">
          <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50 flex items-center justify-between">
            <h2 className="font-semibold text-slate-100 text-sm">
              Lavagens Registradas ({lavagens.length})
            </h2>
            <Link
              to="/funcionarios/publico"
              className="btn-secondary py-1 px-3 text-xs h-auto min-h-0"
            >
              Registrar nova
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
                    : "border-slate-700 text-slate-300 hover-border-slate-500 hover:text-white"
                }`}
                title={`Filtrar por ${dia.label}`}
              >
                {dia.label}
              </button>
            ))}
          </div>

          {lavagens.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 text-sm">
                Nenhuma lavagem cadastrada.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-800/50 text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-2 font-medium text-xs">Descrição</th>
                    <th className="px-4 py-2 font-medium text-xs text-right">
                      Preço
                    </th>
                    <th className="px-4 py-2 font-medium text-xs text-right">
                      Data
                    </th>
                    <th className="px-4 py-2 font-medium text-xs">
                      Funcionário
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {lavagensFiltradas.map((lavagem) => (
                    <tr
                      key={lavagem.id}
                      className="hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-4 py-2.5 text-slate-100 font-medium">
                        {lavagem.descricao}
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-100 font-semibold">
                        R$ {lavagem.preco.toFixed(2).replace(".", ",")}
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-300">
                        {formatDatePtBr(lavagem.data_lavagem)}
                      </td>
                      <td className="px-4 py-2.5 text-slate-300">
                        {lavagem.funcionario_nome}
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
