import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { requererUsuario } from "~/utils/session.server";
import { criarFuncionario } from "~/utils/funcionarios.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requererUsuario(request);
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  await requererUsuario(request);

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
        { status: 400 }
      );
    }
    porcentagemNum = p;
  }

  try {
    await criarFuncionario(
      nome,
      email || undefined,
      telefone || undefined,
      porcentagemNum
    );
    return redirect("/dashboard");
  } catch (error: any) {
    return json(
      { erro: "Erro ao criar funcionário. Tente novamente." },
      { status: 500 }
    );
  }
}

export default function NovoFuncionario() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-3">
          <div className="flex items-center gap-2.5">
            <a
              href="/dashboard"
              className="w-7 h-7 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors"
            >
              <svg
                className="w-3.5 h-3.5 text-slate-400"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M10 12l-4-4 4-4" />
              </svg>
            </a>
            <div>
              <h1 className="text-base font-semibold text-slate-100 leading-none">
                Novo Funcionário
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Cadastre um novo membro da equipe
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
        <div className="card max-w-2xl mx-auto p-2">
          <Form method="post" className="space-y-4">
            {actionData?.erro && (
              <div className="bg-red-900/30 border border-red-800 text-red-400 px-3 py-2 rounded-lg text-sm">
                {actionData.erro}
              </div>
            )}

            <div>
              <label
                htmlFor="nome"
                className="block text-xs font-medium text-slate-300 mb-1"
              >
                Nome Completo *
              </label>
              <input
                type="text"
                id="nome"
                name="nome"
                required
                className="input-field"
                placeholder="Ex: João da Silva"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="telefone"
                  className="block text-xs font-medium text-slate-300 mb-1"
                >
                  Telefone
                </label>
                <input
                  type="tel"
                  id="telefone"
                  name="telefone"
                  className="input-field"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <label
                  htmlFor="porcentagem_comissao"
                  className="block text-xs font-medium text-slate-300 mb-1"
                >
                  Porcentagem de Comissão (%)
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
                    className="input-field pr-10"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                    %
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Padrão: 40%
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-700 flex gap-2 justify-end">
              <a href="/dashboard" className="btn-secondary">
                Cancelar
              </a>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary"
              >
                {isSubmitting ? "Salvando..." : "Salvar Funcionário"}
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
