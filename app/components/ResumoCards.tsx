type InfoSemana = {
  inicioFormatado: string;
  fimFormatado: string;
};

type Props = {
  offsetSemana: number;
  infoSemana: InfoSemana;
  navegarSemana: (novoOffset: number) => void;
  totalReceita: number;
  totalLavagens: number;
  totalFuncionariosAtivos: number;
  totalDespesas: number;
};

export function ResumoCards({
  offsetSemana,
  infoSemana,
  navegarSemana,
  totalReceita,
  totalLavagens,
  totalFuncionariosAtivos,
  totalDespesas,
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      {/* Filtro de Semana */}
      <div className="card p-3 mb-4 h-full items-center justify-center flex">
        <div className="flex items-center flex-col md:flex-row justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navegarSemana(offsetSemana + 1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors"
              title="Semana anterior"
            >
              <svg
                className="w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div className="text-center min-w-[200px]">
              <p className="text-xs text-slate-400">Semana</p>
              <p className="text-sm font-medium text-slate-100">
                {infoSemana.inicioFormatado} - {infoSemana.fimFormatado}
              </p>
            </div>
            <button
              onClick={() => navegarSemana(Math.max(0, offsetSemana - 1))}
              disabled={offsetSemana === 0}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Próxima semana"
            >
              <svg
                className="w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
          {offsetSemana > 0 && (
            <button
              onClick={() => navegarSemana(0)}
              className="text-xs text-indigo-400 hover:text-indigo-300 mt-2 md:mt-0"
            >
              Voltar para semana atual
            </button>
          )}
        </div>
      </div>

      <div className="card p-3 hover:border-indigo-500 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-900/30 rounded-lg">
            <svg
              className="w-5 h-5 text-indigo-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 1a7 7 0 110 14 7 7 0 010-14zm0 2.5a.5.5 0 01.5.5v4.5h3.5a.5.5 0 010 1h-4a.5.5 0 01-.5-.5V6a.5.5 0 01.5-.5z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Receita Total</p>
            <p className="text-lg font-bold text-slate-100 mt-0.5 tracking-tight">
              R$ {totalReceita.toFixed(2).replace(".", ",")}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="card p-3 hover:border-blue-500 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-900/30 rounded-lg">
              <svg
                className="w-5 h-5 text-blue-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <rect x="3" y="4" width="14" height="12" rx="1" />
                <path d="M3 7h14M7 10h6M7 13h4" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Lavagens</p>
              <p className="text-lg font-bold text-slate-100 mt-0.5 tracking-tight">
                {totalLavagens}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-3 hover:border-purple-500 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-900/30 rounded-lg">
              <svg
                className="w-5 h-5 text-purple-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <circle cx="10" cy="6" r="3" />
                <path d="M4 16c0-2.5 2.5-4.5 6-4.5s6 2 6 4.5v1H4v-1z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Funcionários</p>
              <p className="text-lg font-bold text-slate-100 mt-0.5 tracking-tight">
                {totalFuncionariosAtivos}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-3 hover:border-red-500 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-900/30 rounded-lg">
            <svg
              className="w-5 h-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 1a7 7 0 110 14 7 7 0 010-14zm0 3.5a.5.5 0 01.5.5v4.5h3.5a.5.5 0 010 1h-4a.5.5 0 01-.5-.5V7a.5.5 0 01.5-.5z" />
              <path d="M6 10h8v1H6z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Despesas</p>
            <p className="text-lg font-bold text-slate-100 mt-0.5 tracking-tight">
              R$ {totalDespesas.toFixed(2).replace(".", ",")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

