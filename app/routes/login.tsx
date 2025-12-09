import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-3">
      <div className="w-full max-w-md">
        <div className="card p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-indigo-900/30 rounded-lg mb-3">
              <svg className="w-5 h-5 text-indigo-400" viewBox="0 0 16 16" fill="currentColor">
                <rect x="2" y="2" width="5" height="5" rx="0.5"/>
                <rect x="9" y="2" width="5" height="5" rx="0.5"/>
                <rect x="2" y="9" width="5" height="5" rx="0.5"/>
                <rect x="9" y="9" width="5" height="5" rx="0.5"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-100 mb-1">
              Lava Jato Gestão
            </h1>
            <p className="text-slate-400 text-xs">Faça login para continuar</p>
          </div>
          
          <Form method="post" className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-slate-300 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="input-field"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label htmlFor="senha" className="block text-xs font-medium text-slate-300 mb-1">
                Senha
              </label>
              <input
                type="password"
                id="senha"
                name="senha"
                required
                className="input-field"
                placeholder="••••••••"
              />
            </div>
            {actionData?.erro && (
              <div className="bg-red-900/30 border border-red-800 text-red-400 px-3 py-2 rounded-lg text-sm">
                {actionData.erro}
              </div>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Entrando...
                </span>
              ) : "Entrar"}
            </button>
          </Form>
          
          <p className="mt-4 text-center text-xs text-slate-400">
            Primeira vez?{" "}
            <a href="/registro" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
              Criar conta
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

