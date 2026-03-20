import { Link } from "@remix-run/react";

type ItemTotal = {
  funcionario_id: string;
  funcionario_nome: string;
  total: number;
  totalVales?: number;
  comissao?: number;
  valorLiquido?: number;
};

type Funcionario = {
  id: string;
  porcentagem_comissao?: number;
  ativo: number;
};

type Props = {
  itens: ItemTotal[];
  funcionarios: Funcionario[];
};

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function FuncionariosList({ itens, funcionarios }: Props) {
  const maxLavado = Math.max(...itens.map((f) => f.total), 1);

  return (
    <div
      className="bg-surface rounded-md"
      style={{ border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <p
          className="font-mono-app uppercase tracking-[0.12em]"
          style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)" }}
        >
          DESEMPENHO POR FUNCIONÁRIO
        </p>
        <Link
          to="/funcionarios"
          className="font-mono-app text-accent hover:opacity-80"
          style={{ fontSize: "0.65rem", color: "#4D7C5F" }}
        >
          Ver Equipe
        </Link>
      </div>

      {itens.map((item) => {
        const funcionario = funcionarios.find((f) => f.id === item.funcionario_id);
        const perc = funcionario?.porcentagem_comissao ?? 40;
        const comissao = item.comissao ?? item.total * (perc / 100);
        const totalVales = item.totalVales ?? 0;
        const valorLiquido = item.valorLiquido ?? comissao - totalVales;

        return (
          <Link
            key={item.funcionario_id}
            to={`/funcionarios/${item.funcionario_id}`}
            className="block px-5 py-4 hover-item cursor-pointer"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div className="flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-display font-semibold text-sm">
                    {item.funcionario_nome}
                  </span>
                  <span
                    className="font-mono-app uppercase"
                    style={{
                      fontSize: "0.6rem",
                      color: funcionario?.ativo ? "rgba(255,255,255,0.5)" : "rgba(239,68,68,0.95)",
                    }}
                  >
                    {funcionario?.ativo ? "ATIVO" : "INATIVO"}
                  </span>
                </div>

                <div
                  className="w-full h-[2px] rounded-none mb-3"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                >
                  <div
                    className="h-full"
                    style={{
                      width: `${(item.total / maxLavado) * 100}%`,
                      background: funcionario?.ativo ? "#4D7C5F" : "rgba(239,68,68,0.8)",
                      transition: "width 0.6s ease-out",
                    }}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span
                    className="font-mono-app text-xs"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    R$ {formatCurrency(item.total)} lavado
                  </span>
                  <span
                    className="font-mono-app text-xs text-accent"
                    style={{ color: "#4D7C5F" }}
                  >
                    R$ {formatCurrency(comissao)} comissão
                  </span>
                  {totalVales > 0 && (
                    <span
                      className="font-mono-app text-xs"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      R$ {formatCurrency(totalVales)} vales
                    </span>
                  )}
                  <span
                    className="font-mono-app text-xs font-medium"
                    style={{ color: "#4D7C5F" }}
                  >
                    R$ {formatCurrency(valorLiquido)} a receber
                  </span>
                </div>
              </div>

              <svg
                className="w-3.5 h-3.5 shrink-0"
                style={{ color: "rgba(255,255,255,0.2)" }}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
