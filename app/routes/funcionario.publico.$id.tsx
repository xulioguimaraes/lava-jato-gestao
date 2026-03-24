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
  useLoaderData,
  useNavigation,
  useNavigate,
  useSearchParams,
} from "@remix-run/react";
import { buscarFuncionarioPorId } from "~/utils/funcionarios.server";
import { buscarUsuarioPorId } from "~/utils/auth.server";
import {
  criarLavagem,
  listarLavagensPorFuncionario,
  calcularComissaoFuncionario,
  obterInfoSemana,
} from "~/utils/lavagens.server";
import { calcularTotalValesFuncionario } from "~/utils/vales.server";
import { useRef, useState, useEffect } from "react";
import { pageTitle } from "~/utils/meta";
import { formatDatePtBr } from "~/utils/date";
import { Toast } from "~/components/Toast";
import { AnimatedCounter } from "~/components/dashboard/AnimatedCounter";

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
  const userId = funcionario.user_id || undefined;

  const url = new URL(request.url);
  const offsetSemana = parseInt(url.searchParams.get("semana") || "0", 10) || 0;

  let usuarioSlug: string | null = null;
  if (funcionario.user_id) {
    const usuario = await buscarUsuarioPorId(funcionario.user_id);
    usuarioSlug = usuario?.slug || null;
  }

  const [lavagens, comissao, totalVales, infoSemana] = await Promise.all([
    listarLavagensPorFuncionario(funcionario.id, offsetSemana, false, userId),
    calcularComissaoFuncionario(funcionario.id, offsetSemana, userId),
    calcularTotalValesFuncionario(funcionario.id, offsetSemana, userId),
    Promise.resolve(obterInfoSemana(offsetSemana)),
  ]);

  const valorLiquido = comissao.comissao - totalVales;

  return json({
    funcionario,
    lavagens,
    comissao,
    totalVales,
    valorLiquido,
    offsetSemana,
    infoSemana,
    usuarioSlug,
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const funcionario = await buscarFuncionarioPorId(params.id!);
  if (!funcionario) {
    return json({ erro: "Funcionário não encontrado" }, { status: 404 });
  }
  const userId = funcionario.user_id || undefined;

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

  const formasValidas = ["pix", "dinheiro", "cartao"];
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
      formaPagamentoValida,
      userId
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
  const {
    funcionario,
    lavagens,
    comissao,
    totalVales,
    valorLiquido,
    offsetSemana,
    infoSemana,
    usuarioSlug,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
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

  const formatCurrency = (v: number) =>
    "R$ " +
    v.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const backTo = usuarioSlug ? `/${usuarioSlug}` : undefined;

  return (
    <div className="min-h-screen bg-deep pb-12">
      {showToast && (
        <Toast
          message="Lavagem registrada com sucesso!"
          onClose={() => setShowToast(false)}
        />
      )}

      {/* Header */}
      <header
        className="sticky top-0 z-50 bg-deep px-4 py-3 flex items-center gap-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        {backTo ? (
          <Link
            to={backTo}
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => navigate(-1)}
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div>
          <h1 className="font-display font-bold text-base tracking-tight">
            {funcionario.nome}
          </h1>
          <p
            className="font-mono-app"
            style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)" }}
          >
            Registre suas lavagens e acompanhe seu desempenho
          </p>
        </div>
      </header>

      <main className="px-4 max-w-[800px] mx-auto space-y-4 mt-4">
        {/* Week Selector */}
        <div
          className="bg-surface rounded-md px-5 py-4 flex items-center justify-between"
          style={{ border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <button
            type="button"
            onClick={() => navegarSemana(offsetSemana + 1)}
            className="hover-item p-1"
          >
            <svg
              className="w-4 h-4"
              style={{ color: "rgba(255,255,255,0.3)" }}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-center">
            <p
              className="font-mono-app uppercase"
              style={{
                fontSize: "0.6rem",
                color: "rgba(255,255,255,0.3)",
                letterSpacing: "0.12em",
              }}
            >
              SEMANA
            </p>
            <p className="font-mono-app text-sm mt-0.5">
              {infoSemana.inicioFormatado} – {infoSemana.fimFormatado}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navegarSemana(Math.max(0, offsetSemana - 1))}
            disabled={offsetSemana === 0}
            className="hover-item p-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="w-4 h-4"
              style={{ color: "rgba(255,255,255,0.3)" }}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* KPIs */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 bg-surface rounded-md"
          style={{ border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="px-5 py-4">
            <p
              className="font-mono-app uppercase tracking-[0.12em] mb-2"
              style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)" }}
            >
              TOTAL LAVADO
            </p>
            <p
              className="font-extrabold text-xl tracking-tight"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              <AnimatedCounter value={comissao.total} prefix="R$ " isCurrency />
            </p>
          </div>
          <div
            className="px-5 py-4"
            style={{ borderLeft: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p
              className="font-mono-app uppercase tracking-[0.12em] mb-2"
              style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)" }}
            >
              COMISSÃO ({comissao.porcentagem || 40}%)
            </p>
            <p
              className="font-extrabold text-xl tracking-tight text-accent"
              style={{ fontFamily: "'Poppins', sans-serif", color: "#4D7C5F" }}
            >
              <AnimatedCounter value={comissao.comissao} prefix="R$ " isCurrency />
            </p>
          </div>
          <div
            className="px-5 py-4"
            style={{ borderLeft: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p
              className="font-mono-app uppercase tracking-[0.12em] mb-2"
              style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)" }}
            >
              VALES
            </p>
            <p
              className="font-extrabold text-xl tracking-tight"
              style={{ fontFamily: "'Poppins', sans-serif", color: "rgba(255,255,255,0.6)" }}
            >
              <AnimatedCounter value={totalVales} prefix="R$ " isCurrency />
            </p>
          </div>
          <div
            className="px-5 py-4"
            style={{ borderLeft: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p
              className="font-mono-app uppercase tracking-[0.12em] mb-2"
              style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)" }}
            >
              VALOR A RECEBER
            </p>
            <p
              className="font-extrabold text-xl tracking-tight"
              style={{ fontFamily: "'Poppins', sans-serif", color: "#4D7C5F" }}
            >
              <AnimatedCounter value={valorLiquido} prefix="R$ " isCurrency />
            </p>
          </div>
        </div>

        {/* Register Button */}
        <div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-md font-mono-app text-sm"
            style={{
              background: "#4D7C5F",
              color: "#0C0C0C",
              fontWeight: 500,
            }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Registrar Nova Lavagem
          </button>
        </div>

        {/* Lavagens List */}
        <div
          className="bg-surface rounded-md"
          style={{ border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="px-5 pt-5 pb-3">
            <h2 className="font-display font-bold text-sm tracking-tight">
              Lavagens da Semana
            </h2>
          </div>

          {lavagens.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p
                className="font-mono-app"
                style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.2)" }}
              >
                Nenhuma lavagem registrada esta semana
              </p>
            </div>
          ) : (
            <div>
              {lavagens.map((lavagem) => {
                const comissaoValor =
                  (lavagem.preco * (comissao.porcentagem || 40)) / 100;
                return (
                  <div
                    key={lavagem.id}
                    className="px-5 py-3.5 hover-item"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    <p className="font-mono-app text-sm">{lavagem.descricao}</p>
                    <p
                      className="font-mono-app mt-0.5"
                      style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}
                    >
                      {formatDatePtBr(lavagem.data_lavagem)}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span
                        className="font-mono-app text-xs"
                        style={{
                          fontFamily: "'Poppins', sans-serif",
                          fontWeight: 600,
                        }}
                      >
                        {formatCurrency(lavagem.preco)}
                      </span>
                      <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
                      <span
                        className="font-mono-app text-xs text-accent"
                        style={{ color: "#4D7C5F" }}
                      >
                        Comissão: {formatCurrency(comissaoValor)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Bottom Sheet for registration */}
      {isModalOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={() => {
              setIsModalOpen(false);
              setPrecoFormatado("");
            }}
            aria-hidden="true"
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[90vh] overflow-y-auto"
            style={{
              background: "#141414",
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              className="w-10 h-1 mx-auto mt-3 rounded-full"
              style={{ background: "rgba(255,255,255,0.15)" }}
            />
            <div className="px-6 pt-5 pb-6">
              <h3 className="font-display font-bold text-sm">
                Registrar Lavagem
              </h3>
              <p
                className="font-mono-app mt-1"
                style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)" }}
              >
                Preencha os dados da lavagem
              </p>

              <Form
                method="post"
                encType="multipart/form-data"
                className="space-y-4 mt-5"
              >
                {actionData?.erro && (
                  <div
                    className="px-3 py-2 rounded text-sm"
                    style={{
                      background: "rgba(248,113,113,0.15)",
                      border: "1px solid rgba(248,113,113,0.3)",
                      color: "#fca5a5",
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
                    O que você lavou? *
                  </label>
                  <input
                    type="text"
                    id="descricao"
                    name="descricao"
                    required
                    placeholder="Ex: Carro completo, Moto, Tapete..."
                    className="w-full px-3 py-2 rounded font-mono-app text-sm"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="preco"
                      className="block font-mono-app text-xs mb-1"
                      style={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      Preço (R$) *
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
                        id="preco"
                        value={precoFormatado}
                        onChange={handlePrecoChange}
                        required
                        placeholder="0,00"
                        inputMode="numeric"
                        className="w-full pl-9 pr-3 py-2 rounded font-mono-app text-sm"
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      />
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
                      className="block font-mono-app text-xs mb-1"
                      style={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      Pagamento *
                    </label>
                    <select
                      id="forma_pagamento"
                      name="forma_pagamento"
                      required
                      defaultValue="pix"
                      className="w-full px-3 py-2 rounded font-mono-app text-sm"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      <option value="pix">Pix</option>
                      <option value="dinheiro">Dinheiro</option>
                      <option value="cartao">Cartão de Crédito</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="data_lavagem"
                    className="block font-mono-app text-xs mb-1"
                    style={{ color: "rgba(255,255,255,0.5)" }}
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
                    className="w-full px-3 py-2 rounded font-mono-app text-sm"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setPrecoFormatado("");
                    }}
                    className="flex-1 px-4 py-2.5 rounded font-mono-app text-sm hover-item"
                    style={{
                      border: "1px solid rgba(255,255,255,0.2)",
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 rounded font-mono-app text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: "#4D7C5F",
                      color: "#0C0C0C",
                    }}
                  >
                    {isSubmitting ? "Registrando..." : "Registrar"}
                  </button>
                </div>
              </Form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
