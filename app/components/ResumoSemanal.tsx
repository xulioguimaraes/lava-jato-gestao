import { parseDateOnly } from "~/utils/date";

type LavagemLike = {
  data_lavagem: string;
  preco: number;
};

const diasOrdem = [
  { label: "Seg", value: 1 },
  { label: "Ter", value: 2 },
  { label: "Qua", value: 3 },
  { label: "Qui", value: 4 },
  { label: "Sex", value: 5 },
  { label: "Sáb", value: 6 },
  { label: "Dom", value: 0 },
];

function formatar(valor: number) {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function ResumoSemanal({ lavagens }: { lavagens: LavagemLike[] }) {
  const porDia = diasOrdem.map((dia) => ({
    ...dia,
    total: 0,
    quantidade: 0,
  }));

  for (const lavagem of lavagens) {
    const date = parseDateOnly(lavagem.data_lavagem);
    const diaSemana = date.getDay(); // 0 = domingo, 1 = segunda, ...
    const alvo = porDia.find((d) => d.value === diaSemana);
    if (alvo) {
      alvo.total += lavagem.preco;
      alvo.quantidade += 1;
    }
  }

  const totalSemana = porDia.reduce((acc, d) => acc + d.total, 0);

  return (
    <div className="card h-full">
      <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50">
        <h3 className="font-semibold text-slate-100 text-sm">
          Resumo da Semana (lavagens por dia)
        </h3>
      </div>
      <div className="p-4 space-y-3">
        {porDia.map((dia) => (
          <div
            key={dia.value}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-2 text-slate-200">
              <span className="w-8 inline-block font-semibold">{dia.label}</span>
              <span className="text-xs text-slate-400">
                {dia.quantidade}{" "}
                {dia.quantidade === 1 ? "lavagem" : "lavagens"}
              </span>
            </div>
            <span className="font-semibold text-slate-100">
              R$ {formatar(dia.total)}
            </span>
          </div>
        ))}
        <div className="pt-2 mt-1 border-t border-slate-700 flex items-center justify-between text-sm">
          <span className="text-slate-300 font-semibold">Total da semana</span>
          <span className="text-emerald-400 font-bold">
            R$ {formatar(totalSemana)}
          </span>
        </div>
      </div>
    </div>
  );
}

