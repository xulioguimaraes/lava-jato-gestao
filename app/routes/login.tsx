import { json, redirect } from "@remix-run/node";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { Form, Link, useActionData, useNavigation } from "@remix-run/react";
import { verificarLogin } from "~/utils/auth.server";
import { criarSessaoUsuario, obterUsuario } from "~/utils/session.server";
import { pageTitle } from "~/utils/meta";

export const meta: MetaFunction = () => [
  { title: pageTitle("Login") },
  { name: "description", content: "Acesse o painel - X Lava Jato" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const usuario = await obterUsuario(request);
  if (usuario) {
    return redirect("/dashboard");
  }
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const senha = formData.get("senha") as string;

  if (!email || !senha) {
    return json({ erro: "Email e senha são obrigatórios" }, { status: 400 });
  }

  const usuario = await verificarLogin(email, senha);

  if (!usuario) {
    return json({ erro: "Email ou senha inválidos" }, { status: 401 });
  }

  return criarSessaoUsuario(usuario.id, "/dashboard");
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-deep p-4">
      <div className="w-full max-w-md">
        <div
          className="bg-surface rounded-md p-6 md:p-8"
          style={{ border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex flex-col items-center mb-6">
            <div
              className="w-10 h-10 rounded-md flex items-center justify-center mb-4"
              style={{ background: "rgba(77,124,95,0.15)" }}
            >
              <svg
                className="w-5 h-5"
                style={{ color: "#4D7C5F" }}
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <rect x="2" y="2" width="5" height="5" rx="0.5" />
                <rect x="9" y="2" width="5" height="5" rx="0.5" />
                <rect x="2" y="9" width="5" height="5" rx="0.5" />
                <rect x="9" y="9" width="5" height="5" rx="0.5" />
              </svg>
            </div>
            <h1 className="font-display font-extrabold text-xl tracking-tight">
              Lava Jato Gestão
            </h1>
            <p
              className="font-mono-app mt-1"
              style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.35)" }}
            >
              Faça login para continuar
            </p>
          </div>

          <Form method="post" className="space-y-4">
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
                required
                className="w-full px-3 py-2 rounded font-mono-app text-sm"
                style={inputStyle}
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label
                htmlFor="senha"
                className="block font-mono-app text-xs mb-1"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Senha
              </label>
              <input
                type="password"
                id="senha"
                name="senha"
                required
                className="w-full px-3 py-2 rounded font-mono-app text-sm"
                style={inputStyle}
                placeholder="••••••••"
              />
            </div>
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
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-2.5 rounded font-mono-app text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "#4D7C5F", color: "#0C0C0C" }}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
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
                  Entrando...
                </span>
              ) : (
                "Entrar"
              )}
            </button>
          </Form>

          <p
            className="mt-4 text-center font-mono-app"
            style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}
          >
            Primeira vez?{" "}
            <Link
              to="/registro"
              className="font-semibold text-accent hover:opacity-80 transition-opacity"
            >
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
