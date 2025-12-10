import { Link, Form, useNavigation } from "@remix-run/react";
import { useCallback, useEffect, useMemo } from "react";
import type { Despesa } from "~/utils/despesas.server";
import { formatDatePtBr } from "~/utils/date";

type Props = {
  despesas: Despesa[];
  editingDespesaId: string | null;
  setEditingDespesaId: (id: string | null) => void;
};

export function DespesasRecentes({
  despesas,
  editingDespesaId,
  setEditingDespesaId,
}: Props) {
  const navigation = useNavigation();
  const isSubmittingUpdate =
    navigation.state === "submitting" &&
    navigation.formData?.get("intent") === "updateDespesa";
  const savingDespesaId = navigation.formData?.get("despesaId")?.toString();
  const isSavingCurrent = isSubmittingUpdate && savingDespesaId === editingDespesaId;

  useEffect(() => {
    if (navigation.state === "loading" && editingDespesaId && savingDespesaId === editingDespesaId) {
      setEditingDespesaId(null);
    }
  }, [navigation.state, editingDespesaId, savingDespesaId, setEditingDespesaId]);

  const cancelarEdicao = useCallback(() => setEditingDespesaId(null), [setEditingDespesaId]);

  return (
    <div className="card flex flex-col h-full ">
      <div className="px-4 py-3 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
        <h3 className="font-semibold text-slate-100 text-sm">Despesas Recentes</h3>
        <div className="flex items-center gap-2">
          <Link
            to="/despesas"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
          >
            Ver todas
          </Link>
          <Link
            to="/despesas/novo"
            className="btn-secondary py-1 px-2 text-xs h-auto min-h-0"
          >
            + Nova
          </Link>
        </div>
      </div>
      <div className="p-0 flex-1">
        {despesas.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-slate-500 text-sm">Nenhuma despesa registrada.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {despesas.slice(0, 3).map((despesa) => (
              <div
                key={despesa.id}
                className="p-3 hover:bg-slate-800/50 transition-colors"
              >
                {editingDespesaId === despesa.id ? (
                  <Form method="post" encType="multipart/form-data" className="space-y-3">
                    <input type="hidden" name="intent" value="updateDespesa" />
                    <input type="hidden" name="despesaId" value={despesa.id} />

                    <div>
                      <label
                        htmlFor={`descricao-${despesa.id}`}
                        className="block text-xs font-medium text-slate-300 mb-1"
                      >
                        Descrição *
                      </label>
                      <input
                        type="text"
                        id={`descricao-${despesa.id}`}
                        name="descricao"
                        defaultValue={despesa.descricao}
                        required
                        className="input-field"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor={`valor-${despesa.id}`}
                          className="block text-xs font-medium text-slate-300 mb-1"
                        >
                          Valor (R$) *
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                            R$
                          </span>
                          <input
                            type="number"
                            id={`valor-${despesa.id}`}
                            name="valor"
                            defaultValue={despesa.valor}
                            step="0.01"
                            min="0.01"
                            required
                            disabled={isSavingCurrent}
                            className="input-field pl-8 disabled:opacity-50"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor={`data-${despesa.id}`}
                          className="block text-xs font-medium text-slate-300 mb-1"
                        >
                          Data *
                        </label>
                        <input
                          type="date"
                          id={`data-${despesa.id}`}
                          name="data_despesa"
                          defaultValue={despesa.data_despesa}
                          required
                          disabled={isSavingCurrent}
                          className="input-field disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor={`observacoes-${despesa.id}`}
                        className="block text-xs font-medium text-slate-300 mb-1"
                      >
                        Observações
                      </label>
                      <textarea
                        id={`observacoes-${despesa.id}`}
                        name="observacoes"
                        rows={2}
                        defaultValue={despesa.observacoes || ""}
                          disabled={isSavingCurrent}
                          className="input-field resize-none disabled:opacity-50"
                      />
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-700">
                      <button
                        type="submit"
                        className="btn-primary text-xs py-1 px-2 disabled:opacity-50"
                        disabled={isSavingCurrent}
                      >
                        {isSavingCurrent ? "Salvando..." : "Salvar"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelarEdicao}
                        className="btn-secondary text-xs py-1 px-2 disabled:opacity-50"
                        disabled={isSavingCurrent}
                      >
                        Cancelar
                      </button>
                    </div>
                  </Form>
                ) : (
                  <>
                    <div className="flex gap-3">
                      <div className="flex-1 flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-slate-100">
                            {despesa.descricao}
                          </p>
                          <span className="text-xs text-slate-500 mt-0.5 block">
                            {formatDatePtBr(despesa.data_despesa)}
                          </span>
                          {despesa.observacoes && (
                            <span className="text-xs text-slate-400 mt-0.5 block">
                              {despesa.observacoes}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-red-400">
                          - R$ {despesa.valor.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700">
                      <button
                        onClick={() => setEditingDespesaId(despesa.id)}
                        className="btn-secondary text-xs py-1 px-2"
                      >
                        Editar
                      </button>
                      <Form method="post" className="inline">
                        <input type="hidden" name="intent" value="deleteDespesa" />
                        <input type="hidden" name="despesaId" value={despesa.id} />
                        <button
                          type="submit"
                          className="btn-danger text-xs py-1 px-2"
                          onClick={(e) => {
                            if (
                              !confirm("Tem certeza que deseja excluir esta despesa?")
                            ) {
                              e.preventDefault();
                            }
                          }}
                        >
                          Excluir
                        </button>
                      </Form>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

