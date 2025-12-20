import { Link } from "@remix-run/react";
import { formatDatePtBr } from "~/utils/date";
import type { LavagemComFuncionario } from "~/utils/lavagens.server";

export function LavagensRecentes({
  lavagens,
}: {
  lavagens: LavagemComFuncionario[];
}) {
  return (
    <div className="card flex flex-col h-full lg:col-span-2">
      <div className="px-4 py-3 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
        <h3 className="font-semibold text-slate-100 text-sm">
          Últimas Lavagens
        </h3>
        <span className="text-xs font-medium text-slate-400 bg-slate-700 px-1.5 py-0.5 rounded border border-slate-600">
          {lavagens.length} registros
        </span>
      </div>
      <div className="p-0 flex-1 overflow-hidden">
        {lavagens.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-5 h-5 text-slate-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <rect x="3" y="4" width="14" height="12" rx="1" />
                <path d="M3 7h14M7 10h6M7 13h4" />
              </svg>
            </div>
            <p className="text-slate-400 text-sm">
              Nenhuma lavagem registrada.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {lavagens.slice(0, 5).map((lavagem) => (
              <div
                key={lavagem.id}
                className="p-3 hover:bg-slate-800/50 transition-colors flex items-start justify-between group"
              >
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center shrink-0 text-slate-500 border border-slate-600">
                    <span className="text-xs font-bold">
                      {lavagem.funcionario_nome.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-100">
                      {lavagem.descricao}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Feito por{" "}
                      <span className="font-medium text-slate-300">
                        {lavagem.funcionario_nome}
                      </span>{" "}
                      • {formatDatePtBr(lavagem.data_lavagem)}
                      <br />
                      {lavagem.forma_pagamento && (
                        <>
                          {" "}
                          Pagamento:{" "}
                          {lavagem.forma_pagamento === "pix"
                            ? "Pix"
                            : "Dinheiro"}
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-100 bg-slate-700 px-2 py-0.5 rounded border border-slate-600 inline-block">
                    R$ {lavagem.preco.toFixed(2).replace(".", ",")}
                  </p>
                </div>
              </div>
            ))}
            {lavagens.length > 5 && (
              <div className="p-2 text-center border-t border-slate-700 bg-slate-800/30">
                <Link
                  to="/lavagens"
                  className="text-xs text-indigo-400 font-medium hover:text-indigo-300 transition-colors"
                >
                  Ver todas as lavagens
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
