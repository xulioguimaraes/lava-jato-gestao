import { Link } from "@remix-run/react";
import type { Funcionario } from "~/utils/funcionarios.server";

type ItemTotal = {
  funcionario_id: string;
  funcionario_nome: string;
  total: number;
};

export function DesempenhoFuncionarios({
  itens,
  funcionarios,
}: {
  itens: ItemTotal[];
  funcionarios: Funcionario[];
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 card">
        <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50">
          <h3 className="font-semibold text-slate-100 text-sm">
            Desempenho por Funcionário
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/50 text-slate-400 border-b border-slate-700">
              <tr>
                <th className="px-4 py-2 font-medium text-xs">Funcionário</th>
                <th className="px-4 py-2 font-medium text-right text-xs">
                  Total Lavado
                </th>
                <th className="px-4 py-2 font-medium text-right text-xs">
                  Comissão
                </th>
                <th className="px-4 py-2 font-medium text-right text-xs">
                  Status
                </th>
                <th className="px-4 py-2 font-medium text-xs"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {itens.map((item) => {
                const funcionario = funcionarios.find(
                  (f) => f.id === item.funcionario_id
                );
                const perc = funcionario?.porcentagem_comissao ?? 40;
                const comissao = item.total * (perc / 100);

                return (
                  <tr
                    key={item.funcionario_id}
                    className="hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-2.5 font-medium text-slate-100">
                      {item.funcionario_nome}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-300 whitespace-nowrap">
                      R$ {item.total.toFixed(2).replace(".", ",")}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-emerald-400 whitespace-nowrap">
                      R$ {comissao.toFixed(2).replace(".", ",")}{" "}
                      <span className="text-xs text-slate-500">({perc}%)</span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span
                        className={`badge ${
                          funcionario?.ativo ? "badge-success" : "badge-neutral"
                        }`}
                      >
                        {funcionario?.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link
                        to={`/funcionarios/${item.funcionario_id}`}
                        className="text-indigo-400 hover:text-indigo-300 font-medium text-xs hover:underline"
                      >
                        Detalhes
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card h-fit">
        <div className="px-4 py-3 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
          <h3 className="font-semibold text-slate-100 text-sm">Equipe</h3>
          <Link
            to="/funcionarios/novo"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
          >
            + Adicionar
          </Link>
        </div>
        <div className="p-2">
          <div className="space-y-0.5">
            {funcionarios.map((funcionario) => (
              <Link
                key={funcionario.id}
                to={`/funcionarios/${funcionario.id}`}
                className="flex items-center justify-between p-2 hover:bg-slate-800/50 rounded transition-colors group border border-transparent hover:border-slate-700"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      funcionario.ativo ? "bg-emerald-400" : "bg-slate-500"
                    }`}
                  ></div>
                  <span className="text-xs text-slate-300 font-medium group-hover:text-slate-100">
                    {funcionario.nome}
                  </span>
                </div>
                <svg
                  className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M6 4l6 4-6 4V4z" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
