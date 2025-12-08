import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { buscarFuncionarioPorId } from "~/utils/funcionarios.server";
import { criarLavagem } from "~/utils/lavagens.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const funcionario = await buscarFuncionarioPorId(params.id!);
  if (!funcionario) {
    throw new Response("Funcionário não encontrado", { status: 404 });
  }
  return json({ funcionario });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const descricao = formData.get("descricao") as string;
  const preco = formData.get("preco") as string;
  const foto = formData.get("foto") as File | null;
  const dataLavagem = formData.get("data_lavagem") as string;

  if (!descricao || !preco || !dataLavagem) {
    return json({ erro: "Descrição, preço e data são obrigatórios" }, { status: 400 });
  }

  const precoNum = parseFloat(preco);
  if (isNaN(precoNum) || precoNum <= 0) {
    return json({ erro: "Preço inválido" }, { status: 400 });
  }

  // Converter foto para base64 (solução simples)
  let fotoUrl: string | null = null;
  if (foto && foto.size > 0) {
    const arrayBuffer = await foto.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    fotoUrl = `data:${foto.type};base64,${base64}`;
  }

  try {
    await criarLavagem(
      params.id!,
      descricao,
      precoNum,
      fotoUrl,
      dataLavagem
    );
    return redirect(`/funcionarios/${params.id}/perfil`);
  } catch (error) {
    return json({ erro: "Erro ao registrar lavagem. Tente novamente." }, { status: 500 });
  }
}

export default function NovaLavagem() {
  const { funcionario } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  // Data padrão: hoje
  const hoje = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-slate-900 py-4">
      <div className="max-w-2xl mx-auto px-3 sm:px-4">
        <div className="card p-4">
          <h1 className="text-xl font-bold text-slate-100 mb-1">
            Registrar Lavagem
          </h1>
          <p className="text-sm text-slate-400 mb-4">
            Funcionário: <span className="font-semibold text-slate-300">{funcionario.nome}</span>
          </p>

          <Form method="post" encType="multipart/form-data" className="space-y-3">
            <div>
              <label htmlFor="descricao" className="block text-xs font-medium text-slate-300 mb-1">
                O que você lavou? *
              </label>
              <input
                type="text"
                id="descricao"
                name="descricao"
                required
                className="input-field"
                placeholder="Ex: Carro completo, Moto, etc."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="preco" className="block text-xs font-medium text-slate-300 mb-1">
                  Preço (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">R$</span>
                  <input
                    type="number"
                    id="preco"
                    name="preco"
                    required
                    min="0"
                    step="0.01"
                    className="input-field pl-8"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="data_lavagem" className="block text-xs font-medium text-slate-300 mb-1">
                  Data da Lavagem *
                </label>
                <input
                  type="date"
                  id="data_lavagem"
                  name="data_lavagem"
                  required
                  defaultValue={hoje}
                  max={hoje}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label htmlFor="foto" className="block text-xs font-medium text-slate-300 mb-1">
                Foto (opcional)
              </label>
              <input
                type="file"
                id="foto"
                name="foto"
                accept="image/*"
                className="input-field text-xs file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
              />
              <p className="text-xs text-slate-500 mt-1">
                Formatos aceitos: JPG, PNG, etc.
              </p>
            </div>

            {actionData?.erro && (
              <div className="bg-red-900/30 border border-red-800 text-red-400 px-3 py-2 rounded text-sm">
                {actionData.erro}
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-slate-700">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex-1"
              >
                {isSubmitting ? "Registrando..." : "Registrar Lavagem"}
              </button>
              <a
                href="/funcionarios/publico"
                className="btn-secondary"
              >
                Cancelar
              </a>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}

