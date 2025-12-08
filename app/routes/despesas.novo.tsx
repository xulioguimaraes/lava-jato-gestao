import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { requererUsuario } from "~/utils/session.server";
import { criarDespesa } from "~/utils/despesas.server";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  await requererUsuario(request);
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  await requererUsuario(request);
  const formData = await request.formData();
  const descricao = formData.get("descricao") as string;
  const valor = formData.get("valor") as string;
  const dataDespesa = formData.get("data_despesa") as string;
  const observacoes = formData.get("observacoes") as string | null;

  if (!descricao || !valor || !dataDespesa) {
    return json({ erro: "Descrição, valor e data são obrigatórios" }, { status: 400 });
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
      observacoes || null
    );
    return redirect("/dashboard");
  } catch (error) {
    return json({ erro: "Erro ao registrar despesa. Tente novamente." }, { status: 500 });
  }
}

export default function NovaDespesa() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [valorFormatado, setValorFormatado] = useState("");

  // Data padrão: hoje
  const hoje = new Date().toISOString().split("T")[0];

  // Função para formatar valor como moeda brasileira
  const formatarMoeda = (valor: string): string => {
    // Remove tudo que não é dígito
    const apenasDigitos = valor.replace(/\D/g, "");
    
    // Se estiver vazio, retorna vazio
    if (apenasDigitos === "") return "";
    
    // Converte para número e divide por 100 para ter centavos
    const valorNumerico = parseFloat(apenasDigitos) / 100;
    
    // Formata como moeda brasileira
    return valorNumerico.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Função para converter valor formatado de volta para número
  const desformatarMoeda = (valor: string): string => {
    // Remove tudo que não é dígito
    const apenasDigitos = valor.replace(/\D/g, "");
    
    if (apenasDigitos === "") return "";
    
    // Converte para número e divide por 100
    const valorNumerico = parseFloat(apenasDigitos) / 100;
    
    return valorNumerico.toFixed(2);
  };

  // Handler para mudança no input
  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    const formatado = formatarMoeda(valor);
    setValorFormatado(formatado);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-3">
          <div className="flex items-center gap-2.5">
            <a
              href="/dashboard"
              className="w-7 h-7 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10 12l-4-4 4-4"/>
              </svg>
            </a>
            <div>
              <h1 className="text-base font-semibold text-slate-100 leading-none">Nova Despesa</h1>
              <p className="text-xs text-slate-400 mt-0.5">Registre uma nova despesa no sistema</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
        <div className="card p-2 max-w-2xl mx-auto">
          <Form method="post" className="space-y-4">
            {actionData?.erro && (
              <div className="bg-red-900/30 border border-red-800 text-red-400 px-3 py-2 rounded-lg text-sm">
                {actionData.erro}
              </div>
            )}

            <div>
              <label htmlFor="descricao" className="block text-xs font-medium text-slate-300 mb-1">
                Descrição *
              </label>
              <input
                type="text"
                id="descricao"
                name="descricao"
                required
                className="input-field"
                placeholder="Ex: Compra de produtos de limpeza"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="valor" className="block text-xs font-medium text-slate-300 mb-1">
                  Valor (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">R$</span>
                  <input
                    type="text"
                    id="valor"
                    value={valorFormatado}
                    onChange={handleValorChange}
                    required
                    className="input-field pl-8"
                    placeholder="0,00"
                    inputMode="numeric"
                  />
                  {/* Input hidden para enviar o valor numérico ao backend */}
                  <input
                    type="hidden"
                    name="valor"
                    value={desformatarMoeda(valorFormatado)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="data_despesa" className="block text-xs font-medium text-slate-300 mb-1">
                  Data *
                </label>
                <input
                  type="date"
                  id="data_despesa"
                  name="data_despesa"
                  required
                  defaultValue={hoje}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label htmlFor="observacoes" className="block text-xs font-medium text-slate-300 mb-1">
                Observações
              </label>
              <textarea
                id="observacoes"
                name="observacoes"
                rows={3}
                className="input-field resize-none"
                placeholder="Informações adicionais sobre a despesa..."
              />
            </div>

            <div className="pt-3 border-t border-slate-700 flex gap-2 justify-end">
              <a
                href="/dashboard"
                className="btn-secondary"
              >
                Cancelar
              </a>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary"
              >
                {isSubmitting ? "Salvando..." : "Registrar Despesa"}
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}

