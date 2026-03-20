import { Link } from "@remix-run/react";
import { formatDatePtBr } from "~/utils/date";

type Lavagem = {
  id: string;
  descricao: string;
  preco: number;
  funcionario_nome: string;
  data_lavagem: string;
  forma_pagamento: string | null;
};

type Props = { lavagens: Lavagem[] };

const getInitials = (name: string) => name.slice(0, 2).toUpperCase();

export function LavagensList({ lavagens }: Props) {
  const display = lavagens.slice(0, 7);

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
          ÚLTIMAS LAVAGENS
        </p>
        <span
          className="font-mono-app"
          style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.2)" }}
        >
          {lavagens.length} registros
        </span>
      </div>

      <div>
        {display.map((l) => (
          <div
            key={l.id}
            className="flex items-center gap-3 px-5 py-3 hover-item"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div
              className="w-7 h-7 flex items-center justify-center font-mono-app shrink-0"
              style={{
                fontSize: "0.6rem",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 4,
                color: "rgba(255,255,255,0.5)",
              }}
            >
              {getInitials(l.funcionario_nome)}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-mono-app text-sm">{l.descricao}</p>
              <p
                className="font-mono-app"
                style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}
              >
                {l.funcionario_nome} · {formatDatePtBr(l.data_lavagem)}
              </p>
            </div>

            <div className="text-right shrink-0">
              <p
                className="font-bold text-sm"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                R$ {l.preco.toFixed(2).replace(".", ",")}
              </p>
              <p
                className="font-mono-app uppercase"
                style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.25)" }}
              >
                {l.forma_pagamento === "pix" ? "PIX" : l.forma_pagamento === "dinheiro" ? "DINHEIRO" : "-"}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 py-4">
        <Link
          to="/lavagens"
          className="font-mono-app text-accent hover:opacity-80"
          style={{ fontSize: "0.75rem", color: "#4D7C5F" }}
        >
          Ver todas as lavagens
        </Link>
      </div>
    </div>
  );
}
