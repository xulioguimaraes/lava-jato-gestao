import { Link, Form, useNavigation } from "@remix-run/react";
import { useCallback, useEffect } from "react";
import type { Despesa } from "~/utils/despesas.server";
import { formatDatePtBr } from "~/utils/date";

type Props = {
  despesas: Despesa[];
  editingDespesaId: string | null;
  setEditingDespesaId: (id: string | null) => void;
};

export function DespesasRecentesDashboard({
  despesas,
  editingDespesaId,
  setEditingDespesaId,
}: Props) {
  const navigation = useNavigation();
  const isSubmittingUpdate =
    navigation.state === "submitting" &&
    navigation.formData?.get("intent") === "updateDespesa";
  const savingDespesaId = navigation.formData?.get("despesaId")?.toString();
  const isSavingCurrent =
    isSubmittingUpdate && savingDespesaId === editingDespesaId;

  useEffect(() => {
    if (
      navigation.state === "loading" &&
      editingDespesaId &&
      savingDespesaId === editingDespesaId
    ) {
      setEditingDespesaId(null);
    }
  }, [
    navigation.state,
    editingDespesaId,
    savingDespesaId,
    setEditingDespesaId,
  ]);

  const cancelarEdicao = useCallback(
    () => setEditingDespesaId(null),
    [setEditingDespesaId]
  );

  const display = despesas.slice(0, 5);

  return (
    <div
      className="bg-surface rounded-md py-10 flex flex-col"
      style={{ border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="px-5 pb-3 flex items-center justify-between">
        <p
          className="font-mono-app uppercase tracking-[0.12em]"
          style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)" }}
        >
          DESPESAS RECENTES
        </p>
        <div className="flex items-center gap-2">
          <Link
            to="/despesas"
            className="font-mono-app text-accent hover:opacity-80"
            style={{ fontSize: "0.65rem", color: "#4D7C5F" }}
          >
            Ver todas
          </Link>
          <Link
            to="/despesas/novo"
            className="font-mono-app text-accent hover:opacity-80 flex items-center gap-1"
            style={{ fontSize: "0.65rem", color: "#4D7C5F" }}
          >
            <span>+</span>
            <span>Nova</span>
          </Link>
        </div>
      </div>

      {display.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-5">
          <p
            className="font-mono-app mb-4"
            style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.2)" }}
          >
            Nenhuma despesa registrada
          </p>
          <Link
            to="/despesas/novo"
            className="font-mono-app text-accent flex items-center gap-1.5 hover:opacity-80"
            style={{ fontSize: "0.8rem", color: "#4D7C5F" }}
          >
            <span>+</span>
            <span>Registrar despesa</span>
          </Link>
        </div>
      ) : (
        <div>
          {display.map((despesa) => (
            <div
              key={despesa.id}
              className="px-5 py-3"
              style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
            >
              {editingDespesaId === despesa.id ? (
                <Form method="post" encType="multipart/form-data" className="space-y-3">
                  <input type="hidden" name="intent" value="updateDespesa" />
                  <input type="hidden" name="despesaId" value={despesa.id} />
                  <input type="hidden" name="observacoes" value={despesa.observacoes || ""} />

                  <input
                    type="text"
                    name="descricao"
                    defaultValue={despesa.descricao}
                    required
                    className="w-full px-2 py-1.5 bg-black/30 border rounded text-sm"
                    style={{ borderColor: "rgba(255,255,255,0.1)" }}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      name="valor"
                      defaultValue={despesa.valor}
                      step="0.01"
                      min="0.01"
                      required
                      disabled={isSavingCurrent}
                      className="w-full px-2 py-1.5 bg-black/30 border rounded text-sm disabled:opacity-50"
                      style={{ borderColor: "rgba(255,255,255,0.1)" }}
                    />
                    <input
                      type="date"
                      name="data_despesa"
                      defaultValue={despesa.data_despesa}
                      required
                      disabled={isSavingCurrent}
                      className="w-full px-2 py-1.5 bg-black/30 border rounded text-sm disabled:opacity-50"
                      style={{ borderColor: "rgba(255,255,255,0.1)" }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isSavingCurrent}
                      className="px-3 py-1 text-xs font-mono-app rounded"
                      style={{
                        background: "#4D7C5F",
                        color: "#0C0C0C",
                      }}
                    >
                      {isSavingCurrent ? "Salvando..." : "Salvar"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelarEdicao}
                      disabled={isSavingCurrent}
                      className="px-3 py-1 text-xs font-mono-app rounded border disabled:opacity-50"
                      style={{ borderColor: "rgba(255,255,255,0.2)" }}
                    >
                      Cancelar
                    </button>
                  </div>
                </Form>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-mono-app text-sm">{despesa.descricao}</p>
                      <p
                        className="font-mono-app mt-0.5"
                        style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}
                      >
                        {formatDatePtBr(despesa.data_despesa)}
                      </p>
                    </div>
                    <p
                      className="font-bold text-sm text-red-400 shrink-0"
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                      - R$ {despesa.valor.toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setEditingDespesaId(despesa.id)}
                      className="font-mono-app text-accent text-xs hover:opacity-80"
                      style={{ color: "#4D7C5F" }}
                    >
                      Editar
                    </button>
                    <Form method="post" className="inline">
                      <input type="hidden" name="intent" value="deleteDespesa" />
                      <input type="hidden" name="despesaId" value={despesa.id} />
                      <button
                        type="submit"
                        className="font-mono-app text-xs hover:opacity-80"
                        style={{ color: "rgba(255,255,255,0.4)" }}
                        onClick={(e) => {
                          if (!confirm("Excluir esta despesa?")) {
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
  );
}
