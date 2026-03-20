import { json, redirect } from "@remix-run/node";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useNavigation,
  useSearchParams,
} from "@remix-run/react";
import { useState, type ChangeEvent } from "react";
import { requererUsuario } from "~/utils/session.server";
import { criarDespesa } from "~/utils/despesas.server";
import { Toast } from "~/components/Toast";
import { BottomNav } from "~/components/dashboard/BottomNav";
import { pageTitle } from "~/utils/meta";

export const meta: MetaFunction = () => [
  { title: pageTitle("Nova Despesa") },
  { name: "description", content: "Registrar nova despesa - X Lava Jato" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  await requererUsuario(request);
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const usuario = await requererUsuario(request);
  const formData = await request.formData();
  const descricao = formData.get("descricao") as string;
  const valor = formData.get("valor") as string;
  const dataDespesa = formData.get("data_despesa") as string;
  const observacoes = formData.get("observacoes") as string | null;

  if (!descricao || !valor || !dataDespesa) {
    return json(
      { erro: "Descrição, valor e data são obrigatórios" },
      { status: 400 }
    );
  }

  const valorNum = parseFloat(valor);
  if (isNaN(valorNum) || valorNum <= 0) {
    return json({ erro: "Valor inválido" }, { status: 400 });
  }

  try {
    await criarDespesa(
      descricao,
      valorNum,
      dataDespesa,
      observacoes || null,
      usuario.id
    );
    return redirect("/despesas?toast=ok");
  } catch (error) {
    return json(
      { erro: "Erro ao registrar despesa. Tente novamente." },
      { status: 500 }
    );
  }
}

export default function NovaDespesa() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [valorFormatado, setValorFormatado] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  const hoje = new Date().toISOString().split("T")[0];

  const formatarMoeda = (valor: string): string => {
    const apenasDigitos = valor.replace(/\D/g, "");
    if (apenasDigitos === "") return "";
    const valorNumerico = parseFloat(apenasDigitos) / 100;
    return valorNumerico.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const desformatarMoeda = (valor: string): string => {
    const apenasDigitos = valor.replace(/\D/g, "");
    if (apenasDigitos === "") return "";
    const valorNumerico = parseFloat(apenasDigitos) / 100;
    return valorNumerico.toFixed(2);
  };

  const handleValorChange = (e: ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    const formatado = formatarMoeda(valor);
    setValorFormatado(formatado);
  };

  const mostrarToast = searchParams.get("toast") === "ok";
  const fecharToast = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("toast");
    setSearchParams(next, { replace: true });
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
  };

  return (
    <div className="min-h-screen bg-deep pb-24 md:pb-8">
      {mostrarToast && (
        <Toast message="Despesa registrada com sucesso!" onClose={fecharToast} />
      )}
      <header
        className="sticky top-0 z-50 bg-deep px-4 py-3 flex items-center gap-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <Link
          to="/despesas"
          className="w-8 h-8 rounded-md flex items-center justify-center hover-item"
          style={{ border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>
        <div>
          <h1 className="font-display font-bold text-base tracking-tight">
            Nova Despesa
          </h1>
          <p
            className="font-mono-app"
            style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)" }}
          >
            Registre uma nova despesa no sistema
          </p>
        </div>
      </header>

      <main className="px-4 py-6 max-w-2xl mx-auto">
        <div
          className="bg-surface rounded-md p-5 md:p-6"
          style={{ border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <Form method="post" className="space-y-4">
            {actionData?.erro && (
              <div
                className="px-3 py-2 rounded font-mono-app text-sm"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "rgba(239,68,68,0.95)",
                }}
              >
                {actionData.erro}
              </div>
            )}

            <div>
              <label
                htmlFor="descricao"
                className="block font-mono-app text-xs mb-1"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Descrição *
              </label>
              <input
                type="text"
                id="descricao"
                name="descricao"
                required
                className="w-full px-3 py-2 rounded font-mono-app text-sm"
                style={inputStyle}
                placeholder="Ex: Compra de produtos de limpeza"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="valor"
                  className="block font-mono-app text-xs mb-1"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  Valor (R$) *
                </label>
                <div className="relative">
                  <span
                    className="absolute left-3 top-1/2 -translate-y-1/2 font-mono-app text-sm"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    R$
                  </span>
                  <input
                    type="text"
                    id="valor"
                    value={valorFormatado}
                    onChange={handleValorChange}
                    required
                    className="w-full pl-9 pr-3 py-2 rounded font-mono-app text-sm"
                    style={inputStyle}
                    placeholder="0,00"
                    inputMode="numeric"
                  />
                  <input
                    type="hidden"
                    name="valor"
                    value={desformatarMoeda(valorFormatado)}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="data_despesa"
                  className="block font-mono-app text-xs mb-1"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  Data *
                </label>
                <input
                  type="date"
                  id="data_despesa"
                  name="data_despesa"
                  required
                  defaultValue={hoje}
                  className="w-full px-3 py-2 rounded font-mono-app text-sm"
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="observacoes"
                className="block font-mono-app text-xs mb-1"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Observações
              </label>
              <textarea
                id="observacoes"
                name="observacoes"
                rows={3}
                className="w-full px-3 py-2 rounded font-mono-app text-sm resize-none"
                style={inputStyle}
                placeholder="Informações adicionais sobre a despesa..."
              />
            </div>

            <div
              className="pt-4 flex gap-3 justify-end"
              style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
            >
              <Link
                to="/despesas"
                className="px-4 py-2.5 rounded font-mono-app text-sm"
                style={{ border: "1px solid rgba(255,255,255,0.2)" }}
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded font-mono-app text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "#4D7C5F", color: "#0C0C0C" }}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      style={{ color: "#0C0C0C" }}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Salvando...
                  </span>
                ) : (
                  "Registrar Despesa"
                )}
              </button>
            </div>
          </Form>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

