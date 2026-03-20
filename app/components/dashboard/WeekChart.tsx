import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { parseDateOnly } from "~/utils/date";

type LavagemLike = { data_lavagem: string; preco: number };

const diasOrdem = [
  { label: "SEG", value: 1 },
  { label: "TER", value: 2 },
  { label: "QUA", value: 3 },
  { label: "QUI", value: 4 },
  { label: "SEX", value: 5 },
  { label: "SÁB", value: 6 },
  { label: "DOM", value: 0 },
];

type Props = { lavagens: LavagemLike[] };

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="font-mono-app text-xs px-3 py-2"
      style={{
        background: "#1A1A1A",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 4,
      }}
    >
      <p style={{ color: "rgba(255,255,255,0.5)" }}>{label}</p>
      <p className="mt-1">R$ {payload[0].value.toFixed(2).replace(".", ",")}</p>
    </div>
  );
}

function CustomXAxisTick({
  x,
  y,
  payload,
  index,
  data,
}: {
  x: number | string;
  y: number | string;
  payload?: { value: string };
  index?: number;
  data: { day: string; value: number }[];
}) {
  const value = data[index ?? 0]?.value ?? 0;
  return (
    <g transform={`translate(${Number(x)},${Number(y)})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="middle"
        className="font-mono-app"
        style={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }}
      >
        {payload?.value ?? ""}
      </text>
      <text
        x={0}
        y={0}
        dy={28}
        textAnchor="middle"
        className="font-mono-app"
        style={{
          fontSize: 9,
          fill: value > 0 ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)",
        }}
      >
        R$ {value.toFixed(0)}
      </text>
    </g>
  );
}

export function WeekChart({ lavagens }: Props) {
  const porDia = diasOrdem.map((d) => ({
    day: d.label,
    value: 0,
  }));

  for (const lavagem of lavagens) {
    const date = parseDateOnly(lavagem.data_lavagem);
    const diaSemana = date.getDay();
    const idx = diasOrdem.findIndex((d) => d.value === diaSemana);
    if (idx >= 0) porDia[idx].value += lavagem.preco;
  }


  return (
    <div
      className="bg-surface rounded-md p-5"
      style={{ border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <p
        className="font-mono-app uppercase tracking-[0.12em] mb-6"
        style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)" }}
      >
        RESUMO DA SEMANA
      </p>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={porDia} barCategoryGap="20%" margin={{ bottom: 36 }}>
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={(props) => <CustomXAxisTick {...props} data={porDia} />}
            />
            <ReferenceLine
              y={0}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={1}
            />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Bar dataKey="value" radius={0} maxBarSize={40}>
              {porDia.map((entry, index) => (
                <Cell
                  key={index}
                  fill={
                    entry.value > 0 ? "rgba(77,124,95,0.6)" : "rgba(255,255,255,0.06)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
