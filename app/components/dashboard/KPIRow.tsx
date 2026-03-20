import { AnimatedCounter } from "./AnimatedCounter";

type Props = {
  totalReceita: number;
  totalLavagens: number;
  totalFuncionariosAtivos: number;
  totalDespesas: number;
};

export function KPIRow({
  totalReceita,
  totalLavagens,
  totalFuncionariosAtivos,
  totalDespesas,
}: Props) {
  const kpis = [
    { label: "RECEITA", value: totalReceita, prefix: "R$ ", highlighted: true },
    { label: "LAVAGENS", value: totalLavagens },
    { label: "FUNCIONÁRIOS", value: totalFuncionariosAtivos },
    { label: "DESPESAS", value: totalDespesas, prefix: "R$ " },
  ];

  return (
    <div
      className="grid grid-cols-2 md:grid-cols-4 bg-surface rounded-md"
      style={{ border: "1px solid rgba(255,255,255,0.07)" }}
    >
      {kpis.map((kpi, i) => (
        <div
          key={kpi.label}
          className="relative px-5 py-5"
          style={{
            borderLeft: kpi.highlighted
              ? "2px solid #4D7C5F"
              : i > 0
                ? "1px solid rgba(255,255,255,0.07)"
                : "none",
            borderTop: i >= 2 ? "1px solid rgba(255,255,255,0.07)" : "none",
          }}
        >
          <p
            className="font-mono-app uppercase tracking-[0.12em] mb-3"
            style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)" }}
          >
            {kpi.label}
          </p>
          <p
            className="font-extrabold text-2xl tracking-tight"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            <AnimatedCounter
              value={kpi.value}
              prefix={kpi.prefix}
              isCurrency={!!kpi.prefix}
            />
          </p>
          <p
            className="font-mono-app mt-2"
            style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.25)" }}
          >
            esta semana
          </p>
        </div>
      ))}
    </div>
  );
}
