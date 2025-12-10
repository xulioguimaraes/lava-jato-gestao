import { json } from "@remix-run/node";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useLoaderData, useSearchParams } from "@remix-run/react";
import { requererUsuario } from "~/utils/session.server";
import { listarTodasDespesas } from "~/utils/despesas.server";
import { formatDatePtBr } from "~/utils/date";
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
  const despesas = await listarTodasDespesas(usuario.id);
  return json({ despesas });
}

export default function DespesasIndexPage() {
  const { despesas } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

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
                <p className="text-xs text-slate-400 mt-0.5">
                  Visualize o histórico completo de despesas.
                </p>
              </div>
            </div>
            <Link
              to="/despesas/novo"
              className="btn-secondary py-1 px-3 text-xs h-auto min-h-0"
            >
              + Nova Despesa
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
        <div className="card">
          <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50 flex items-center justify-between">
            <h2 className="font-semibold text-slate-100 text-sm">
              Despesas Registradas ({despesas.length})
            </h2>
            <Link
              to="/dashboard"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Voltar ao Dashboard
            </Link>
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
                  {despesas.map((despesa) => (
                    <tr
                      key={despesa.id}
                      className="hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-4 py-2.5 text-slate-100 font-medium">
                        {despesa.descricao}
                      </td>
                      <td className="px-4 py-2.5 text-right text-red-300 font-semibold">
                        - R$ {despesa.valor.toFixed(2).replace(".", ",")}
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-300">
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
