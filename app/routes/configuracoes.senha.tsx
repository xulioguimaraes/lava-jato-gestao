import { json, redirect } from "@remix-run/node";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { Form, Link, useActionData, useNavigation } from "@remix-run/react";
import { requererUsuario } from "~/utils/session.server";
import { redefinirSenha } from "~/utils/auth.server";
import { BottomNav } from "~/components/dashboard/BottomNav";
import { pageTitle } from "~/utils/meta";

export const meta: MetaFunction = () => [
  { title: pageTitle("Redefinir Senha") },
  { name: "description", content: "Alterar senha - X Lava Jato" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  await requererUsuario(request);
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const usuario = await requererUsuario(request);
  const formData = await request.formData();
  const senhaAtual = formData.get("senha_atual") as string;
  const senhaNova = formData.get("senha_nova") as string;

  if (!senhaAtual || !senhaNova) {
    return json(
      { erro: "Preencha a senha atual e a nova senha" },
      { status: 400 }
    );
  }

  const resultado = await redefinirSenha(usuario.id, senhaAtual, senhaNova);

  if (!resultado.ok) {
    return json({ erro: resultado.erro }, { status: 400 });
  }

  return redirect("/configuracoes?toast=senha");
}

const inputStyle = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
};

export default function RedefinirSenha() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen bg-deep pb-24 md:pb-8">
      <header
        className="sticky top-0 z-50 bg-deep px-4 py-3 flex items-center gap-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <Link
          to="/configuracoes"
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
            Redefinir senha
          </h1>
          <p
            className="font-mono-app"
            style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)" }}
          >
            Informe sua senha atual e a nova senha
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
                htmlFor="senha_atual"
                className="block font-mono-app text-xs mb-1"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Senha atual *
              </label>
              <input
                type="password"
                id="senha_atual"
                name="senha_atual"
                required
                className="w-full px-3 py-2 rounded font-mono-app text-sm"
                style={inputStyle}
                placeholder="••••••••"
              />
            </div>

            <div>
              <label
                htmlFor="senha_nova"
                className="block font-mono-app text-xs mb-1"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Nova senha *
              </label>
              <input
                type="password"
                id="senha_nova"
                name="senha_nova"
                required
                minLength={6}
                className="w-full px-3 py-2 rounded font-mono-app text-sm"
                style={inputStyle}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div
              className="pt-4 flex gap-3 justify-end"
              style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
            >
              <Link
                to="/configuracoes"
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
                {isSubmitting ? "Salvando..." : "Alterar senha"}
              </button>
            </div>
          </Form>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
