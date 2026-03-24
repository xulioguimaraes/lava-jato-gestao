import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import {
  Form,
  useLoaderData,
  useNavigation,
  useActionData,
  Link,
  useSearchParams,
} from "@remix-run/react";
import { requererUsuario } from "~/utils/session.server";
import {
  buscarFuncionarioPorId,
  atualizarFuncionario,
} from "~/utils/funcionarios.server";
import {
  listarLavagensPorFuncionario,
  calcularComissaoFuncionario,
  atualizarLavagem,
  excluirLavagem,
  obterInfoSemana,
} from "~/utils/lavagens.server";
import {
  listarValesPorFuncionario,
  calcularTotalValesFuncionario,
} from "~/utils/vales.server";
import { useState, useEffect } from "react";
import { formatDatePtBr } from "~/utils/date";
import { Toast } from "~/components/Toast";
import { DashboardHeader } from "~/components/dashboard/DashboardHeader";
import { BottomNav } from "~/components/dashboard/BottomNav";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const usuario = await requererUsuario(request);

  const funcionario = await buscarFuncionarioPorId(params.id!);
  if (!funcionario) {
    throw new Response("Funcionário não encontrado", { status: 404 });
  }

  const url = new URL(request.url);
  const offsetSemana = parseInt(url.searchParams.get("semana") || "0", 10) || 0;
  const infoSemana = obterInfoSemana(offsetSemana);

  // Não trazer fotos para evitar payload grande
  const [lavagens, comissao, vales, totalVales] = await Promise.all([
    listarLavagensPorFuncionario(funcionario.id, offsetSemana, false, usuario.id),
    calcularComissaoFuncionario(funcionario.id, offsetSemana, usuario.id),
    listarValesPorFuncionario(funcionario.id, offsetSemana, usuario.id),
    calcularTotalValesFuncionario(funcionario.id, offsetSemana, usuario.id),
  ]);

  const valorLiquido = comissao.comissao - totalVales;

  return json({
    funcionario,
    lavagens,
    comissao,
    vales,
    totalVales,
    valorLiquido,
    usuario,
    usuarioSlug: usuario.slug || "",
    offsetSemana,
    infoSemana,
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  await requererUsuario(request);

  const formData = await request.formData();
  const intent = formData.get("intent");
  const nome = formData.get("nome") as string;
  const telefone = formData.get("telefone") as string;
  const ativo = formData.get("ativo") === "on";
  const porcentagemComissao = formData.get("porcentagem_comissao") as string;

  if (intent === "update") {
    const porcentagem = porcentagemComissao
      ? parseFloat(porcentagemComissao)
      : undefined;
    if (porcentagem !== undefined && (porcentagem < 0 || porcentagem > 100)) {
      return json(
        { erro: "Porcentagem deve estar entre 0 e 100" },
        { status: 400 },
      );
    }
    await atualizarFuncionario(
      params.id!,
      nome,
      undefined,
      telefone,
      ativo,
      porcentagem,
    );
    const url = new URL(request.url);
    url.searchParams.set("toast", "saved");
    return redirect(url.pathname + "?" + url.searchParams.toString());
  }

  if (intent === "updateLavagem") {
    const lavagemId = formData.get("lavagemId") as string;
    const descricao = formData.get("descricao") as string;
    const preco = formData.get("preco") as string;
    const dataLavagem = formData.get("data_lavagem") as string;
    const formaPagamento = formData.get("forma_pagamento") as string | null;

    if (!descricao || !preco || !dataLavagem) {
      return json(
        { erro: "Descrição, preço e data são obrigatórios" },
        { status: 400 },
      );
    }

    const precoNum = parseFloat(preco);
    if (isNaN(precoNum) || precoNum <= 0) {
      return json({ erro: "Preço inválido" }, { status: 400 });
    }

    const formasValidas = ["pix", "dinheiro", "cartao"];
    const formaPagamentoValida = formaPagamento && formasValidas.includes(formaPagamento)
      ? formaPagamento
      : null;

    await atualizarLavagem(
      lavagemId,
      descricao,
      precoNum,
      dataLavagem,
      formaPagamentoValida,
    );
    const url = new URL(request.url);
    url.searchParams.set("toast", "saved");
    return redirect(url.pathname + "?" + url.searchParams.toString());
  }

  if (intent === "deleteLavagem") {
    const lavagemId = formData.get("lavagemId") as string;
    await excluirLavagem(lavagemId);
    const url = new URL(request.url);
    return redirect(url.pathname + (url.search ? "?" + url.search : ""));
  }

  return null;
}

const inputStyle = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
};

export default function FuncionarioDetalhes() {
  const {
    funcionario,
    lavagens,
    comissao,
    vales,
    totalVales,
    valorLiquido,
    usuario,
    usuarioSlug,
    offsetSemana,
    infoSemana,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const isSubmitting =
    navigation.state === "submitting" || navigation.state === "loading";
  const [showFuncionarioModal, setShowFuncionarioModal] = useState(false);
  const [editingLavagem, setEditingLavagem] = useState<{
    id: string;
    descricao: string;
    preco: number;
    data_lavagem: string;
    forma_pagamento?: string | null;
  } | null>(null);
  const [precoFormatado, setPrecoFormatado] = useState("");
  const [showToast, setShowToast] = useState(false);

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

  const handlePrecoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrecoFormatado(formatarMoeda(e.target.value));
  };

  const openLavagemEdit = (lavagem: { id: string; descricao: string; preco: number; data_lavagem: string; forma_pagamento?: string | null }) => {
    setEditingLavagem(lavagem);
    setPrecoFormatado(
      lavagem.preco.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  };

  useEffect(() => {
    const toastParam = searchParams.get("toast");
    if (toastParam === "saved") {
      setShowToast(true);
      setShowFuncionarioModal(false);
      setEditingLavagem(null);
      setPrecoFormatado("");
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("toast");
      setSearchParams(newParams, { replace: true });
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!showUserMenu) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-user-menu]")) setShowUserMenu(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showUserMenu]);

  const navegarSemana = (novoOffset: number) => {
    const params = new URLSearchParams(searchParams);
    if (novoOffset === 0) params.delete("semana");
    else params.set("semana", novoOffset.toString());
    setSearchParams(params);
  };

  // Função para formatar telefone para WhatsApp
  const formatarTelefoneWhatsApp = (telefone: string | null) => {
    if (!telefone) return null;
    // Remove caracteres não numéricos
    const numeros = telefone.replace(/\D/g, "");
    // Se não começar com 55 (código do Brasil), adiciona
    const telefoneFormatado = numeros.startsWith("55")
      ? numeros
      : `55${numeros}`;
    return `https://wa.me/${telefoneFormatado}`;
  };

  return (
    <div className="min-h-screen bg-deep pb-24 md:pb-8">
      {showToast && (
        <Toast
          message="Salvo com sucesso!"
          onClose={() => setShowToast(false)}
        />
      )}
      <DashboardHeader
        nomeNegocio={usuario.nome_negocio || "Lava Jato Gestão"}
        usuarioSlug={usuarioSlug || ""}
        offsetSemana={offsetSemana}
        infoSemana={infoSemana}
        navegarSemana={navegarSemana}
        showUserMenu={showUserMenu}
        setShowUserMenu={setShowUserMenu}
      />

      <main className="pt-20 px-4 max-w-[1200px] mx-auto space-y-4">
        <div className="mb-2">
          <h1 className="font-display font-extrabold text-xl tracking-tight">
            {funcionario.nome}
          </h1>
          <p
            className="font-mono-app mt-1"
            style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}
          >
            Detalhes do funcionário
          </p>
        </div>

        <div
          className="rounded-xl p-4 mb-4 overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <p
              className="font-mono-app uppercase tracking-[0.12em]"
              style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)" }}
            >
              DADOS DO FUNCIONÁRIO
            </p>
            <button
              type="button"
              onClick={() => setShowFuncionarioModal(true)}
              disabled={isSubmitting}
              className="font-mono-app text-xs py-1.5 px-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.9)",
              }}
            >
              Editar
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <p className="font-mono-app text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Nome</p>
              <p className="font-mono-app text-sm font-medium" style={{ color: "rgba(255,255,255,0.9)" }}>
                {funcionario.nome}
              </p>
            </div>
            {funcionario.telefone && (
              <div>
                <p className="font-mono-app text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Telefone</p>
                <a
                  href={formatarTelefoneWhatsApp(funcionario.telefone) || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono-app text-sm font-medium flex items-center gap-1.5 hover:opacity-80"
                  style={{ color: "#4D7C5F" }}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  {funcionario.telefone}
                </a>
              </div>
            )}
            <div>
              <p className="font-mono-app text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Status</p>
              <span
                className="font-mono-app text-xs px-2 py-0.5 rounded"
                style={{
                  background: funcionario.ativo ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
                  color: funcionario.ativo ? "rgba(34,197,94,0.95)" : "rgba(239,68,68,0.95)",
                }}
              >
                {funcionario.ativo ? "Ativo" : "Inativo"}
              </span>
            </div>
          </div>
        </div>

        {/* Resumo da Semana */}
        <div
          className="rounded-xl p-4 mb-4 overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <p
            className="font-mono-app uppercase tracking-[0.12em] mb-3"
            style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)" }}
          >
            RESUMO DA SEMANA
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-mono-app text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Total Lavado</p>
              <p className="font-mono-app text-lg font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>
                R$ {comissao.total.toFixed(2).replace(".", ",")}
              </p>
            </div>
            <div>
              <p className="font-mono-app text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                Comissão ({comissao.porcentagem || 40}%)
              </p>
              <p className="font-mono-app text-lg font-bold" style={{ color: "#4D7C5F" }}>
                R$ {comissao.comissao.toFixed(2).replace(".", ",")}
              </p>
            </div>
            <div>
              <p className="font-mono-app text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Vales</p>
              <p className="font-mono-app text-lg font-bold" style={{ color: "rgba(239,68,68,0.9)" }}>
                - R$ {totalVales.toFixed(2).replace(".", ",")}
              </p>
            </div>
            <div>
              <p className="font-mono-app text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Valor a receber</p>
              <p
                className="font-mono-app text-lg font-bold"
                style={{
                  color: valorLiquido >= 0 ? "rgba(34,197,94,0.95)" : "rgba(239,68,68,0.95)",
                }}
              >
                R$ {valorLiquido.toFixed(2).replace(".", ",")}
              </p>
            </div>
          </div>
        </div>

        {/* Vales da Semana */}
        <div
          className="rounded-xl p-4 mb-4 overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <p
              className="font-mono-app uppercase tracking-[0.12em]"
              style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)" }}
            >
              VALES DA SEMANA ({vales.length})
            </p>
            <Link
              to={`/vales/novo?funcionario=${funcionario.id}`}
              className="font-mono-app text-xs py-1.5 px-3 rounded-lg"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.9)",
              }}
            >
              + Novo Vale
            </Link>
          </div>
          {vales.length === 0 ? (
            <p className="font-mono-app text-center py-6 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
              Nenhum vale registrado esta semana
            </p>
          ) : (
            <div className="space-y-2">
              {vales.map((vale) => (
                <div
                  key={vale.id}
                  className="flex justify-between items-center p-3 rounded-lg"
                  style={{
                    background: "rgba(239,68,68,0.06)",
                    border: "1px solid rgba(239,68,68,0.15)",
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-mono-app text-sm" style={{ color: "rgba(255,255,255,0.9)" }}>
                      {formatDatePtBr(vale.data_vale)}
                    </p>
                    {vale.observacoes && (
                      <p className="font-mono-app text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                        {vale.observacoes}
                      </p>
                    )}
                  </div>
                  <p className="font-mono-app font-semibold text-sm" style={{ color: "rgba(239,68,68,0.95)" }}>
                    - R$ {vale.valor.toFixed(2).replace(".", ",")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lavagens */}
        <div
          className="rounded-xl p-4 overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <p
            className="font-mono-app uppercase tracking-[0.12em] mb-3"
            style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)" }}
          >
            LAVAGENS DA SEMANA ({lavagens.length})
          </p>
          {lavagens.length === 0 ? (
            <p className="font-mono-app text-center py-8 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
              Nenhuma lavagem registrada esta semana
            </p>
          ) : (
            <div className="space-y-2">
              {lavagens.map((lavagem) => (
                <div
                  key={lavagem.id}
                  className="flex justify-between items-center p-3 rounded-lg transition-colors hover:bg-white/5"
                  style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-mono-app font-medium text-sm" style={{ color: "rgba(255,255,255,0.9)" }}>
                      {lavagem.descricao}
                    </p>
                    <p className="font-mono-app text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {formatDatePtBr(lavagem.data_lavagem)}
                      {lavagem.forma_pagamento && (
                        <> • {lavagem.forma_pagamento === "pix" ? "Pix" : lavagem.forma_pagamento === "cartao" ? "Cartão" : "Dinheiro"}</>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="font-mono-app font-semibold text-sm" style={{ color: "rgba(255,255,255,0.9)" }}>
                      R$ {lavagem.preco.toFixed(2).replace(".", ",")}
                    </p>
                    <button
                      type="button"
                      onClick={() => openLavagemEdit(lavagem)}
                      disabled={isSubmitting}
                      className="font-mono-app text-xs py-1 px-2 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80"
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "rgba(255,255,255,0.7)",
                      }}
                    >
                      Editar
                    </button>
                    <Form method="post" className="inline">
                      <input type="hidden" name="intent" value="deleteLavagem" />
                      <input type="hidden" name="lavagemId" value={lavagem.id} />
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="font-mono-app text-xs py-1 px-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          background: "rgba(239,68,68,0.15)",
                          border: "1px solid rgba(239,68,68,0.3)",
                          color: "rgba(239,68,68,0.95)",
                        }}
                        onClick={(e) => {
                          if (!confirm("Tem certeza que deseja excluir esta lavagem?")) {
                            e.preventDefault();
                          }
                        }}
                      >
                        Excluir
                      </button>
                    </Form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <BottomNav />

      {/* Bottom Sheet - Editar Funcionário */}
      {showFuncionarioModal && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={() => setShowFuncionarioModal(false)}
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
              <h3 className="font-display font-bold text-sm">Editar Funcionário</h3>
              <p className="font-mono-app mt-1" style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)" }}>
                Atualize os dados do funcionário
              </p>

              <Form method="post" className="space-y-4 mt-5">
                <input type="hidden" name="intent" value="update" />
                {actionData && "erro" in actionData && (
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
                  <label htmlFor="nome" className="block font-mono-app text-xs mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Nome *
                  </label>
                  <input
                    type="text"
                    id="nome"
                    name="nome"
                    defaultValue={funcionario.nome}
                    required
                    className="w-full px-3 py-2 rounded font-mono-app text-sm"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label htmlFor="telefone" className="block font-mono-app text-xs mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Telefone
                  </label>
                  <input
                    type="tel"
                    id="telefone"
                    name="telefone"
                    defaultValue={funcionario.telefone || ""}
                    placeholder="(00) 00000-0000"
                    className="w-full px-3 py-2 rounded font-mono-app text-sm"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label htmlFor="porcentagem_comissao" className="block font-mono-app text-xs mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Porcentagem de Comissão (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="porcentagem_comissao"
                      name="porcentagem_comissao"
                      defaultValue={funcionario.porcentagem_comissao || 40}
                      min="0"
                      max="100"
                      step="0.1"
                      className="w-full px-3 py-2 pr-8 rounded font-mono-app text-sm"
                      style={inputStyle}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono-app text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                      %
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="ativo"
                    name="ativo"
                    defaultChecked={funcionario.ativo === 1}
                    className="h-4 w-4 rounded"
                    style={{ accentColor: "#4D7C5F" }}
                  />
                  <label htmlFor="ativo" className="font-mono-app text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
                    Funcionário ativo
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowFuncionarioModal(false)}
                    className="flex-1 px-4 py-2.5 rounded font-mono-app text-sm"
                    style={{ border: "1px solid rgba(255,255,255,0.2)" }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 rounded font-mono-app text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: "#4D7C5F", color: "#0C0C0C" }}
                  >
                    {isSubmitting ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </Form>
            </div>
          </div>
        </>
      )}

      {/* Bottom Sheet - Editar Lavagem */}
      {editingLavagem && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={() => {
              setEditingLavagem(null);
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
              <h3 className="font-display font-bold text-sm">Editar Lavagem</h3>
              <p className="font-mono-app mt-1" style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)" }}>
                Atualize os dados da lavagem
              </p>

              <Form method="post" className="space-y-4 mt-5">
                <input type="hidden" name="intent" value="updateLavagem" />
                <input type="hidden" name="lavagemId" value={editingLavagem.id} />
                {actionData && "erro" in actionData && (
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
                  <label htmlFor="descricao" className="block font-mono-app text-xs mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Descrição *
                  </label>
                  <input
                    type="text"
                    id="descricao"
                    name="descricao"
                    defaultValue={editingLavagem.descricao}
                    required
                    placeholder="Ex: Carro completo, Moto..."
                    className="w-full px-3 py-2 rounded font-mono-app text-sm"
                    style={inputStyle}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="preco" className="block font-mono-app text-xs mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                      Preço (R$) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono-app text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
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
                        style={inputStyle}
                      />
                      <input type="hidden" name="preco" value={desformatarMoeda(precoFormatado)} />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="data_lavagem" className="block font-mono-app text-xs mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                      Data *
                    </label>
                    <input
                      type="date"
                      id="data_lavagem"
                      name="data_lavagem"
                      defaultValue={editingLavagem.data_lavagem}
                      required
                      className="w-full px-3 py-2 rounded font-mono-app text-sm"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="forma_pagamento" className="block font-mono-app text-xs mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Forma de Pagamento *
                  </label>
                  <select
                    id="forma_pagamento"
                    name="forma_pagamento"
                    required
                    defaultValue={editingLavagem.forma_pagamento || "pix"}
                    className="w-full px-3 py-2 rounded font-mono-app text-sm"
                    style={inputStyle}
                  >
                    <option value="pix">Pix</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="cartao">Cartão de Crédito</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingLavagem(null);
                      setPrecoFormatado("");
                    }}
                    className="flex-1 px-4 py-2.5 rounded font-mono-app text-sm"
                    style={{ border: "1px solid rgba(255,255,255,0.2)" }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 rounded font-mono-app text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: "#4D7C5F", color: "#0C0C0C" }}
                  >
                    {isSubmitting ? "Salvando..." : "Salvar"}
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
