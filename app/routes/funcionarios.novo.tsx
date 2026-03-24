import { json, redirect } from "@remix-run/node";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { Form, Link, useActionData, useNavigation } from "@remix-run/react";
import { useCallback } from "react";
import { requererUsuario } from "~/utils/session.server";
import { criarFuncionario } from "~/utils/funcionarios.server";
import { verificarLimiteFuncionarios } from "~/utils/plano.server";
import { BottomNav } from "~/components/dashboard/BottomNav";
import { pageTitle } from "~/utils/meta";

export const meta: MetaFunction = () => [
  { title: pageTitle("Novo Funcionário") },
  { name: "description", content: "Cadastrar novo funcionário - X Lava Jato" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  await requererUsuario(request);
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const usuario = await requererUsuario(request);

  const limite = await verificarLimiteFuncionarios(
    usuario.id,
    usuario.plan_type ?? "free"
  );
  if (!limite.permitido) {
    return json(
      {
        erro: `Seu plano gratuito permite apenas ${limite.limite} funcionário(s). Faça upgrade para o Plano Pro para adicionar mais.`,
        upgrade: true,
      },
      { status: 403 }
    );
  }

  const formData = await request.formData();
  const nome = formData.get("nome") as string;
  const email = formData.get("email") as string;
  const telefone = formData.get("telefone") as string;
  const porcentagem = formData.get("porcentagem_comissao") as string | null;

  if (!nome) {
    return json({ erro: "Nome é obrigatório" }, { status: 400 });
  }

  let porcentagemNum: number | undefined = 40;
  if (porcentagem !== null && porcentagem !== "") {
    const p = parseFloat(porcentagem);
    if (Number.isNaN(p) || p < 0 || p > 100) {
      return json(
        { erro: "Porcentagem deve ser entre 0 e 100" },
        { status: 400 },
      );
    }
    porcentagemNum = p;
  }

  try {
    await criarFuncionario(
      nome,
      email || undefined,
      telefone || undefined,
      porcentagemNum,
      usuario.id,
    );
    return redirect("/funcionarios?toast=ok");
  } catch (error: any) {
    console.error("Erro ao criar funcionário (server):", error);
    return json(
      {
        erro: "Erro ao criar funcionário. Tente novamente.",
        message: error?.message ?? "erro desconhecido",
      },
      { status: 500 },
    );
  }
}

const inputStyle = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
};

function mascararTelefone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function NovoFuncionario() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const handleTelefone = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = mascararTelefone(e.target.value);
  }, []);

  return (
    <div className="min-h-screen bg-deep pb-24 md:pb-8">
      <header
        className="sticky top-0 z-50 bg-deep px-4 py-3 flex items-center gap-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <Link
          to="/funcionarios"
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
            Novo Funcionário
          </h1>
          <p
            className="font-mono-app"
            style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)" }}
          >
            Cadastre um novo membro da equipe
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
                {(actionData as any).upgrade && (
                  <Link
                    to="/assinatura"
                    className="block mt-2 underline text-amber-400 text-xs"
                  >
                    Ver planos →
                  </Link>
                )}
              </div>
            )}

            <div>
              <label
                htmlFor="nome"
                className="block font-mono-app text-xs mb-1"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Nome Completo *
              </label>
              <input
                type="text"
                id="nome"
                name="nome"
                required
                className="w-full px-3 py-2 rounded font-mono-app text-sm"
                style={inputStyle}
                placeholder="Ex: João da Silva"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block font-mono-app text-xs mb-1"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="w-full px-3 py-2 rounded font-mono-app text-sm"
                style={inputStyle}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="telefone"
                  className="block font-mono-app text-xs mb-1"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  Telefone
                </label>
                <input
                  type="tel"
                  id="telefone"
                  name="telefone"
                  className="w-full px-3 py-2 rounded font-mono-app text-sm"
                  style={inputStyle}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  onChange={handleTelefone}
                />
              </div>
              <div>
                <label
                  htmlFor="porcentagem_comissao"
                  className="block font-mono-app text-xs mb-1"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  Comissão (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="porcentagem_comissao"
                    name="porcentagem_comissao"
                    defaultValue={40}
                    min={0}
                    max={100}
                    step={0.1}
                    className="w-full px-3 py-2 pr-8 rounded font-mono-app text-sm"
                    style={inputStyle}
                  />
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 font-mono-app text-sm"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    %
                  </span>
                </div>
                <p
                  className="font-mono-app mt-1"
                  style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}
                >
                  Padrão: 40%
                </p>
              </div>
            </div>

            <div
              className="pt-4 flex gap-3 justify-end"
              style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
            >
              <Link
                to="/funcionarios"
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
                  "Salvar Funcionário"
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
