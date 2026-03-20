import { AnimatedCounter } from "./AnimatedCounter";

type Props = {
  lucroLiquido: number;
  totalReceita: number;
  totalDespesas: number;
  totalComissoes: number;
};

export function LucroComissao({
  lucroLiquido,
  totalReceita,
  totalDespesas,
  totalComissoes,
}: Props) {
  const format = (v: number) =>
    v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div
      className="grid grid-cols-2 bg-surface rounded-md"
      style={{ border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="px-5 py-5">
        <p
          className="font-mono-app uppercase tracking-[0.12em] mb-2"
          style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)" }}
        >
          LUCRO LÍQUIDO
        </p>
        <p
          className={`font-extrabold text-2xl tracking-tight ${lucroLiquido >= 0 ? "text-emerald-400" : ""}`}
          style={{
            fontFamily: "'Poppins', sans-serif",
            color: lucroLiquido < 0 ? "#f87171" : undefined,
          }}
        >
          <AnimatedCounter value={lucroLiquido} prefix="R$ " isCurrency />
        </p>
        <p
          className="font-mono-app mt-2"
          style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.25)" }}
        >
          Receitas: R$ {format(totalReceita)} · Despesas: R$ {format(totalDespesas)}
        </p>
      </div>
      <div
        className="px-5 py-5"
        style={{ borderLeft: "1px solid rgba(255,255,255,0.06)" }}
      >
        <p
          className="font-mono-app uppercase tracking-[0.12em] mb-2"
          style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)" }}
        >
          COMISSÕES A PAGAR
        </p>
        <p
          className="font-extrabold text-2xl tracking-tight text-accent"
          style={{ fontFamily: "'Poppins', sans-serif", color: "#4D7C5F" }}
        >
          <AnimatedCounter value={totalComissoes} prefix="R$ " isCurrency />
        </p>
        <p
          className="font-mono-app mt-2"
          style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.25)" }}
        >
          Calculado por funcionário
        </p>
      </div>
    </div>
  );
}
