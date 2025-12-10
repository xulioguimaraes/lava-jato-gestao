import { json, redirect } from "@remix-run/node";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
  Link,
  useSearchParams,
} from "@remix-run/react";
import { buscarFuncionarioPorId } from "~/utils/funcionarios.server";
import {
  criarLavagem,
  listarLavagensPorFuncionario,
  calcularComissaoFuncionario,
  obterInfoSemana,
} from "~/utils/lavagens.server";
import { useRef, useState, useEffect } from "react";
import { pageTitle } from "~/utils/meta";
import { formatDatePtBr } from "~/utils/date";
import { Toast } from "~/components/Toast";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const nome = data?.funcionario?.nome;
  const titulo = nome ? `Funcionário ${nome}` : "Funcionário";
  return [
    { title: pageTitle(titulo) },
    {
      name: "description",
      content: "Registrar lavagens e ver totais - X Lava Jato",
    },
  ];
};

export async function loader({ params, request }: LoaderFunctionArgs) {
  const funcionario = await buscarFuncionarioPorId(params.id!);
  if (!funcionario) {
    throw new Response("Funcionário não encontrado", { status: 404 });
  }

  // Obter offset da semana da query string (0 = semana atual, 1 = semana anterior, etc.)
  const url = new URL(request.url);
  const offsetSemana = parseInt(url.searchParams.get("semana") || "0", 10) || 0;

  const [lavagens, comissao, infoSemana] = await Promise.all([
    listarLavagensPorFuncionario(funcionario.id, offsetSemana, false), // false = não incluir fotos no loader
    calcularComissaoFuncionario(funcionario.id, offsetSemana),
    Promise.resolve(obterInfoSemana(offsetSemana)),
  ]);

  return json({ funcionario, lavagens, comissao, offsetSemana, infoSemana });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const descricao = formData.get("descricao") as string;
  const preco = formData.get("preco") as string;
  const dataLavagem = formData.get("data_lavagem") as string;
  const formaPagamento = formData.get("forma_pagamento") as string;

  if (!descricao || !preco || !dataLavagem) {
    return json(
      { erro: "Descrição, preço e data são obrigatórios" },
      { status: 400 }
    );
  }

  const precoNum = parseFloat(preco);
  if (isNaN(precoNum) || precoNum <= 0) {
    return json({ erro: "Preço inválido" }, { status: 400 });
  }

  // Foto não é mais capturada pelo usuário
  const fotoUrl: string | null = null;

  const formasValidas = ["pix", "dinheiro"];
  const formaPagamentoValida = formasValidas.includes(formaPagamento || "")
    ? formaPagamento
    : null;

  try {
    await criarLavagem(
      params.id!,
      descricao,
      precoNum,
      fotoUrl,
      dataLavagem,
      formaPagamentoValida
    );
    // Redirecionar mantendo o filtro de semana se existir e adicionando parâmetro de sucesso
    const url = new URL(request.url);
    const semana = url.searchParams.get("semana");
    const redirectUrl = semana
      ? `/funcionario/publico/${params.id}?semana=${semana}&sucesso=1`
      : `/funcionario/publico/${params.id}?sucesso=1`;
    return redirect(redirectUrl);
  } catch (error) {
    console.error("Erro ao registrar lavagem", error);
    return json(
      {
        erro: "Erro ao registrar lavagem. Tente novamente.",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export default function FuncionarioPublico() {
  const { funcionario, lavagens, comissao, offsetSemana, infoSemana } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [searchParams, setSearchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [precoFormatado, setPrecoFormatado] = useState("");

  // Rastrear quando está submetendo
  useEffect(() => {
    if (navigation.state === "submitting" && navigation.formMethod === "POST") {
      wasSubmittingRef.current = true;
    }
  }, [navigation.state, navigation.formMethod]);

  // Fechar modal imediatamente quando o submit for bem-sucedido
  useEffect(() => {
    // Se estava submetendo e agora está em loading/idle sem erro, significa que foi bem-sucedido
    // (loading acontece durante redirect, idle acontece após redirect)
    if (
      wasSubmittingRef.current &&
      (navigation.state === "loading" || navigation.state === "idle") &&
      !actionData?.erro
    ) {
      // Fechar modal imediatamente
      setIsModalOpen(false);
      // Limpar campos
      setPrecoFormatado("");
      // Resetar o ref apenas quando estiver completamente idle
      if (navigation.state === "idle") {
        wasSubmittingRef.current = false;
      }
    }
  }, [navigation.state, actionData?.erro]);

  // Detectar sucesso na URL e mostrar toast
  useEffect(() => {
    const sucesso = searchParams.get("sucesso");
    if (sucesso === "1") {
      setShowToast(true);
      // Remover parâmetro da URL após mostrar o toast
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("sucesso");
      setSearchParams(newParams, { replace: true });
      // Esconder toast após 3 segundos
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, setSearchParams]);

  // Data padrão: hoje
  const hoje = new Date().toISOString().split("T")[0];

  const [showToast, setShowToast] = useState(false);
  const wasSubmittingRef = useRef(false);

  // Função para navegar entre semanas
  const navegarSemana = (novoOffset: number) => {
    const params = new URLSearchParams(searchParams);
    if (novoOffset === 0) {
      params.delete("semana");
    } else {
      params.set("semana", novoOffset.toString());
    }
    setSearchParams(params);
  };

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

  // Handler para mudança no input de preço
  const handlePrecoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    const formatado = formatarMoeda(valor);
    setPrecoFormatado(formatado);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Toast de Sucesso */}
      {showToast && (
        <Toast
          message="Lavagem registrada com sucesso!"
          onClose={() => setShowToast(false)}
        />
      )}

      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-3">
          <div className="flex items-center gap-2.5">
            <Link
              to="/funcionarios/publico"
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
            </Link>
            <div>
              <h1 className="text-base font-semibold text-slate-100 leading-none">
                {funcionario.nome}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Registre suas lavagens e acompanhe seu desempenho
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4">
        {/* Filtro de Semana */}
        <div className="card p-3 mb-4">
          <div className="flex items-center flex-col md:flex-row justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navegarSemana(offsetSemana + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors"
                title="Semana anterior"
              >
                <svg
                  className="w-4 h-4 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div className="text-center min-w-[200px]">
                <p className="text-xs text-slate-400">Semana</p>
                <p className="text-sm font-medium text-slate-100">
                  {infoSemana.inicioFormatado} - {infoSemana.fimFormatado}
                </p>
              </div>
              <button
                onClick={() => navegarSemana(Math.max(0, offsetSemana - 1))}
                disabled={offsetSemana === 0}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Próxima semana"
              >
                <svg
                  className="w-4 h-4 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
            {offsetSemana > 0 && (
              <button
                onClick={() => navegarSemana(0)}
                className="text-xs text-indigo-400 hover:text-indigo-300"
              >
                Voltar para semana atual
              </button>
            )}
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="card p-3">
            <h3 className="text-xs font-medium text-slate-400 mb-1">
              Total Lavado
            </h3>
            <p className="text-lg font-bold text-slate-100">
              R$ {comissao.total.toFixed(2).replace(".", ",")}
            </p>
          </div>
          <div className="card p-3">
            <h3 className="text-xs font-medium text-slate-400 mb-1">
              Sua Comissão ({comissao.porcentagem || 40}%)
            </h3>
            <p className="text-lg font-bold text-emerald-400">
              R$ {comissao.comissao.toFixed(2).replace(".", ",")}
            </p>
          </div>
          <div className="card p-3">
            <h3 className="text-xs font-medium text-slate-400 mb-1">
              Lavagens
            </h3>
            <p className="text-lg font-bold text-slate-100">
              {lavagens.length}
            </p>
          </div>
        </div>

        {/* Botão para abrir modal de nova lavagem */}
        <div className="mb-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Registrar Nova Lavagem
          </button>
        </div>

        {/* Modal de Nova Lavagem */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-4 py-3 flex justify-between items-center">
                <h2 className="text-base font-semibold text-slate-100">
                  Registrar Nova Lavagem
                </h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setPrecoFormatado("");
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="p-4">
                <Form
                  method="post"
                  encType="multipart/form-data"
                  className="space-y-3"
                >
                  {actionData?.erro && (
                    <div className="bg-red-900/30 border border-red-800 text-red-400 px-3 py-2 rounded text-sm">
                      {actionData.erro}
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="descricao"
                      className="block text-xs font-medium text-slate-300 mb-1"
                    >
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

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="preco"
                        className="block text-xs font-medium text-slate-300 mb-1"
                      >
                        Preço (R$) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                          R$
                        </span>
                        <input
                          type="text"
                          id="preco"
                          value={precoFormatado}
                          onChange={handlePrecoChange}
                          required
                          className="input-field pl-8"
                          placeholder="0,00"
                          inputMode="numeric"
                        />
                        {/* Input hidden para enviar o valor numérico ao backend */}
                        <input
                          type="hidden"
                          name="preco"
                          value={desformatarMoeda(precoFormatado)}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="forma_pagamento"
                        className="block text-xs font-medium text-slate-300 mb-1"
                      >
                        Forma de pagamento *
                      </label>
                      <select
                        id="forma_pagamento"
                        name="forma_pagamento"
                        required
                        className="input-field"
                        defaultValue="pix"
                      >
                        <option value="pix">Pix</option>
                        <option value="dinheiro">Dinheiro</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="data_lavagem"
                        className="block text-xs font-medium text-slate-300 mb-1"
                      >
                        Data *
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

                  <div className="flex gap-2 pt-3 border-t border-slate-700">
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        setPrecoFormatado("");
                      }}
                      className="btn-secondary flex-1"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? "Registrando..." : "Registrar Lavagem"}
                    </button>
                  </div>
                </Form>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Lavagens da Semana */}
        <div className="card p-4">
          <h2 className="text-base font-semibold text-slate-100 mb-3">
            Lavagens{" "}
            {offsetSemana === 0
              ? "da Semana"
              : `(${infoSemana.inicioFormatado} - ${infoSemana.fimFormatado})`}
          </h2>
          {lavagens.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-5 h-5 text-slate-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <rect x="3" y="4" width="14" height="12" rx="1" />
                  <path d="M3 7h14M7 10h6M7 13h4" />
                </svg>
              </div>
              <p className="text-slate-400 text-sm">
                Nenhuma lavagem registrada esta semana
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {lavagens.map((lavagem) => (
                <div
                  key={lavagem.id}
                  className="border border-slate-700 rounded-lg p-2.5 hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-100 text-sm truncate">
                      {lavagem.descricao}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatDatePtBr(lavagem.data_lavagem)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs font-semibold text-slate-200">
                        R$ {lavagem.preco.toFixed(2).replace(".", ",")}
                      </p>
                      <span className="text-xs text-emerald-400">
                        • Comissão: R${" "}
                        {((lavagem.preco * (comissao.porcentagem || 40)) / 100)
                          .toFixed(2)
                          .replace(".", ",")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
