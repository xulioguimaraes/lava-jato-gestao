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
    <div className="card">
      <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
        <h3 className="font-semibold text-slate-100 text-sm">
          Desempenho por Funcionário
        </h3>
        <Link
          to="/funcionarios"
          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
        >
          Ver Equipe
        </Link>
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
  );
}
