import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useLoaderData, useSearchParams } from "@remix-run/react";
import { requererUsuario } from "~/utils/session.server";
import {
  listarLavagensSemana,
  calcularTotalSemana,
  obterInfoSemana,
} from "~/utils/lavagens.server";
import { listarFuncionarios } from "~/utils/funcionarios.server";
import { fazerLogout } from "~/utils/session.server";
import {
  listarDespesasSemana,
  calcularTotalDespesasSemana,
  atualizarDespesa,
  excluirDespesa,
  buscarDespesaPorId,
} from "~/utils/despesas.server";
import { Form } from "@remix-run/react";
import { useState } from "react";
import { pageTitle } from "~/utils/meta";

export const meta: MetaFunction = () => [
  { title: pageTitle("Dashboard") },
  { name: "description", content: "Painel administrativo - X Lava Jato" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  await requererUsuario(request);

  // Obter offset da semana da query string (0 = semana atual, 1 = semana anterior, etc.)
  const url = new URL(request.url);
  const offsetSemana = parseInt(url.searchParams.get("semana") || "0", 10) || 0;

  const [lavagens, totais, funcionarios, despesas, totalDespesas, infoSemana] =
    await Promise.all([
      listarLavagensSemana(offsetSemana),
      calcularTotalSemana(offsetSemana),
      listarFuncionarios(),
      listarDespesasSemana(offsetSemana),
      calcularTotalDespesasSemana(offsetSemana),
      Promise.resolve(obterInfoSemana(offsetSemana)),
    ]);

  const lucroLiquido = totais.total - totalDespesas;

  return json({
    lavagens,
    totais,
    funcionarios,
    despesas,
    totalDespesas,
    lucroLiquido,
    offsetSemana,
    infoSemana,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  await requererUsuario(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "logout") {
    return fazerLogout(request);
  }

  if (intent === "updateDespesa") {
    const despesaId = formData.get("despesaId") as string;
    const descricao = formData.get("descricao") as string;
    const valor = formData.get("valor") as string;
    const dataDespesa = formData.get("data_despesa") as string;
    const observacoes = formData.get("observacoes") as string | null;
    const foto = formData.get("foto") as File | null;

    if (!descricao || !valor || !dataDespesa) {
      return json(
        { erro: "Descrição, valor e data são obrigatórios" },
        { status: 400 }
      );
    }

    const valorNum = parseFloat(valor);
    if (isNaN(valorNum) || valorNum <= 0) {
      return json({ erro: "Valor inválido" }, { status: 400 });
    }

    let fotoUrl: string | null = null;
    if (foto && foto.size > 0) {
      const arrayBuffer = await foto.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString("base64");
      fotoUrl = `data:${foto.type};base64,${base64}`;
    } else {
      // Se não enviou nova foto, manter a foto existente
      const despesaExistente = await buscarDespesaPorId(despesaId);
      if (despesaExistente) {
        fotoUrl = despesaExistente.foto_url;
      }
    }

    await atualizarDespesa(
      despesaId,
      descricao,
      valorNum,
      dataDespesa,
      observacoes,
      fotoUrl || ""
    );
    return redirect("/dashboard");
  }

  if (intent === "deleteDespesa") {
    const despesaId = formData.get("despesaId") as string;
    await excluirDespesa(despesaId);
    return redirect("/dashboard");
  }

  return null;
}

export default function Dashboard() {
  const {
    lavagens,
    totais,
    funcionarios,
    despesas,
    totalDespesas,
    lucroLiquido,
    offsetSemana,
    infoSemana,
  } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [editingDespesaId, setEditingDespesaId] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-indigo-600 rounded-lg text-white shadow-sm">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <rect x="2" y="2" width="5" height="5" rx="0.5" />
                  <rect x="9" y="2" width="5" height="5" rx="0.5" />
                  <rect x="2" y="9" width="5" height="5" rx="0.5" />
                  <rect x="9" y="9" width="5" height="5" rx="0.5" />
                </svg>
              </div>
              <div>
                <h1 className="text-base font-semibold text-slate-100 leading-none">
                  Lava Jato Gestão
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Painel Administrativo
                </p>
              </div>
            </div>
            <Form method="post">
              <input type="hidden" name="intent" value="logout" />
              <button
                type="submit"
                className="text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-slate-700"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M6 12l-4-4 4-4M2 8h12" />
                </svg>
                Sair
              </button>
            </Form>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">
            Visão Geral
          </h2>
          <p className="text-sm text-slate-400">
            Acompanhe o desempenho desta semana.
          </p>
        </div>

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
                className="text-xs text-indigo-400 hover:text-indigo-300 mt-2 md:mt-0"
              >
                Voltar para semana atual
              </button>
            )}
          </div>
        </div>
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="card p-3 hover:border-indigo-500 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-900/30 rounded-lg">
                <svg
                  className="w-5 h-5 text-indigo-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 1a7 7 0 110 14 7 7 0 010-14zm0 2.5a.5.5 0 01.5.5v4.5h3.5a.5.5 0 010 1h-4a.5.5 0 01-.5-.5V6a.5.5 0 01.5-.5z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400">
                  Receita Total
                </p>
                <p className="text-lg font-bold text-slate-100 mt-0.5 tracking-tight">
                  R$ {totais.total.toFixed(2).replace(".", ",")}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-3 hover:border-blue-500 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-900/30 rounded-lg">
                <svg
                  className="w-5 h-5 text-blue-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <rect x="3" y="4" width="14" height="12" rx="1" />
                  <path d="M3 7h14M7 10h6M7 13h4" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400">Lavagens</p>
                <p className="text-lg font-bold text-slate-100 mt-0.5 tracking-tight">
                  {lavagens.length}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-3 hover:border-purple-500 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-900/30 rounded-lg">
                <svg
                  className="w-5 h-5 text-purple-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <circle cx="10" cy="6" r="3" />
                  <path d="M4 16c0-2.5 2.5-4.5 6-4.5s6 2 6 4.5v1H4v-1z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400">
                  Funcionários
                </p>
                <p className="text-lg font-bold text-slate-100 mt-0.5 tracking-tight">
                  {funcionarios.filter((f) => f.ativo).length}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-3 hover:border-red-500 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-900/30 rounded-lg">
                <svg
                  className="w-5 h-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 1a7 7 0 110 14 7 7 0 010-14zm0 3.5a.5.5 0 01.5.5v4.5h3.5a.5.5 0 010 1h-4a.5.5 0 01-.5-.5V7a.5.5 0 01.5-.5z" />
                  <path d="M6 10h8v1H6z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400">Despesas</p>
                <p className="text-lg font-bold text-slate-100 mt-0.5 tracking-tight">
                  R$ {totalDespesas.toFixed(2).replace(".", ",")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card de Lucro Líquido */}
        <div className="mb-4">
          <div className="card p-3 hover:border-emerald-500 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    lucroLiquido >= 0 ? "bg-emerald-900/30" : "bg-amber-900/30"
                  }`}
                >
                  <svg
                    className={`w-6 h-6 ${
                      lucroLiquido >= 0 ? "text-emerald-400" : "text-amber-400"
                    }`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M3 3h14v14H3V3zm1 1v12h12V4H4zm2 2h8v1H6V6zm0 3h8v1H6V9zm0 3h5v1H6v-1z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-slate-400">
                    Lucro Líquido da Semana
                  </h3>
                  <p
                    className={`text-xl font-bold mt-0.5 ${
                      lucroLiquido >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    R$ {lucroLiquido.toFixed(2).replace(".", ",")}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Receitas: R$ {totais.total.toFixed(2).replace(".", ",")} •
                    Despesas: R$ {totalDespesas.toFixed(2).replace(".", ",")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Lista de Lavagens da Semana */}
          <div className="card flex flex-col h-full lg:col-span-2">
            <div className="px-4 py-3 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
              <h3 className="font-semibold text-slate-100 text-sm">
                Últimas Lavagens
              </h3>
              <span className="text-xs font-medium text-slate-400 bg-slate-700 px-1.5 py-0.5 rounded border border-slate-600">
                {lavagens.length} registros
              </span>
            </div>
            <div className="p-0 flex-1 overflow-hidden">
              {lavagens.length === 0 ? (
                <div className="text-center py-10">
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
                    Nenhuma lavagem registrada.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700">
                  {lavagens.slice(0, 5).map((lavagem) => (
                    <div
                      key={lavagem.id}
                      className="p-3 hover:bg-slate-800/50 transition-colors flex items-start justify-between group"
                    >
                      <div className="flex gap-3">
                        <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center shrink-0 text-slate-400 border border-slate-600 overflow-hidden">
                          {lavagem.foto_url ? (
                            <img
                              src={lavagem.foto_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-bold text-slate-500">
                              {lavagem.funcionario_nome
                                .substring(0, 2)
                                .toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-100">
                            {lavagem.descricao}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Feito por{" "}
                            <span className="font-medium text-slate-300">
                              {lavagem.funcionario_nome}
                            </span>{" "}
                            •{" "}
                            {new Date(lavagem.data_lavagem).toLocaleDateString(
                              "pt-BR"
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-100 bg-slate-700 px-2 py-0.5 rounded border border-slate-600 inline-block">
                          R$ {lavagem.preco.toFixed(2).replace(".", ",")}
                        </p>
                      </div>
                    </div>
                  ))}
                  {lavagens.length > 5 && (
                    <div className="p-2 text-center border-t border-slate-700 bg-slate-800/30">
                      <button className="text-xs text-indigo-400 font-medium hover:text-indigo-300 transition-colors">
                        Ver todas as lavagens
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Lista de Despesas da Semana */}
          <div className="card flex flex-col h-full ">
            <div className="px-4 py-3 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
              <h3 className="font-semibold text-slate-100 text-sm">
                Despesas Recentes
              </h3>
              <Link
                to="/despesas/novo"
                className="btn-secondary py-1 px-2 text-xs h-auto min-h-0"
              >
                + Nova
              </Link>
            </div>
            <div className="p-0 flex-1">
              {despesas.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-slate-500 text-sm">
                    Nenhuma despesa registrada.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700">
                  {despesas.slice(0, 5).map((despesa) => (
                    <div
                      key={despesa.id}
                      className="p-3 hover:bg-slate-800/50 transition-colors"
                    >
                      {editingDespesaId === despesa.id ? (
                        <Form
                          method="post"
                          encType="multipart/form-data"
                          className="space-y-3"
                        >
                          <input
                            type="hidden"
                            name="intent"
                            value="updateDespesa"
                          />
                          <input
                            type="hidden"
                            name="despesaId"
                            value={despesa.id}
                          />

                          <div>
                            <label
                              htmlFor={`descricao-${despesa.id}`}
                              className="block text-xs font-medium text-slate-300 mb-1"
                            >
                              Descrição *
                            </label>
                            <input
                              type="text"
                              id={`descricao-${despesa.id}`}
                              name="descricao"
                              defaultValue={despesa.descricao}
                              required
                              className="input-field"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label
                                htmlFor={`valor-${despesa.id}`}
                                className="block text-xs font-medium text-slate-300 mb-1"
                              >
                                Valor (R$) *
                              </label>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                                  R$
                                </span>
                                <input
                                  type="number"
                                  id={`valor-${despesa.id}`}
                                  name="valor"
                                  defaultValue={despesa.valor}
                                  step="0.01"
                                  min="0.01"
                                  required
                                  className="input-field pl-8"
                                />
                              </div>
                            </div>

                            <div>
                              <label
                                htmlFor={`data-${despesa.id}`}
                                className="block text-xs font-medium text-slate-300 mb-1"
                              >
                                Data *
                              </label>
                              <input
                                type="date"
                                id={`data-${despesa.id}`}
                                name="data_despesa"
                                defaultValue={despesa.data_despesa}
                                required
                                className="input-field"
                              />
                            </div>
                          </div>

                          <div>
                            <label
                              htmlFor={`observacoes-${despesa.id}`}
                              className="block text-xs font-medium text-slate-300 mb-1"
                            >
                              Observações
                            </label>
                            <textarea
                              id={`observacoes-${despesa.id}`}
                              name="observacoes"
                              rows={2}
                              defaultValue={despesa.observacoes || ""}
                              className="input-field resize-none"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor={`foto-${despesa.id}`}
                              className="block text-xs font-medium text-slate-300 mb-1"
                            >
                              Nova Foto (opcional)
                            </label>
                            <input
                              type="file"
                              id={`foto-${despesa.id}`}
                              name="foto"
                              accept="image/*"
                              className="input-field text-xs"
                            />
                            {despesa.foto_url && (
                              <p className="text-xs text-slate-500 mt-1">
                                Deixe em branco para manter a foto atual
                              </p>
                            )}
                          </div>

                          <div className="flex gap-2 pt-2 border-t border-slate-700">
                            <button
                              type="submit"
                              className="btn-primary text-xs py-1 px-2"
                            >
                              Salvar
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingDespesaId(null)}
                              className="btn-secondary text-xs py-1 px-2"
                            >
                              Cancelar
                            </button>
                          </div>
                        </Form>
                      ) : (
                        <>
                          <div className="flex gap-3">
                            {despesa.foto_url && (
                              <img
                                src={despesa.foto_url}
                                alt={despesa.descricao}
                                className="w-12 h-12 rounded object-cover border border-slate-700 shrink-0"
                              />
                            )}
                            <div className="flex-1 flex justify-between items-start">
                              <div>
                                <p className="text-sm font-medium text-slate-100">
                                  {despesa.descricao}
                                </p>
                                <span className="text-xs text-slate-500 mt-0.5 block">
                                  {new Date(
                                    despesa.data_despesa
                                  ).toLocaleDateString("pt-BR")}
                                </span>
                                {despesa.observacoes && (
                                  <span className="text-xs text-slate-400 mt-0.5 block">
                                    {despesa.observacoes}
                                  </span>
                                )}
                              </div>
                              <span className="text-sm font-semibold text-red-400">
                                - R${" "}
                                {despesa.valor.toFixed(2).replace(".", ",")}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700">
                            <button
                              onClick={() => setEditingDespesaId(despesa.id)}
                              className="btn-secondary text-xs py-1 px-2"
                            >
                              Editar
                            </button>
                            <Form method="post" className="inline">
                              <input
                                type="hidden"
                                name="intent"
                                value="deleteDespesa"
                              />
                              <input
                                type="hidden"
                                name="despesaId"
                                value={despesa.id}
                              />
                              <button
                                type="submit"
                                className="btn-danger text-xs py-1 px-2"
                                onClick={(e) => {
                                  if (
                                    !confirm(
                                      "Tem certeza que deseja excluir esta despesa?"
                                    )
                                  ) {
                                    e.preventDefault();
                                  }
                                }}
                              >
                                Excluir
                              </button>
                            </Form>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 card">
            <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50">
              <h3 className="font-semibold text-slate-100 text-sm">
                Desempenho por Funcionário
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-800/50 text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-2 font-medium text-xs">
                      Funcionário
                    </th>
                    <th className="px-4 py-2 font-medium text-right text-xs">
                      Total Lavado
                    </th>
                    <th className="px-4 py-2 font-medium text-right text-xs">
                      Comissão (40%)
                    </th>
                    <th className="px-4 py-2 font-medium text-right text-xs">
                      Status
                    </th>
                    <th className="px-4 py-2 font-medium text-xs"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {totais.porFuncionario.map((item) => {
                    const funcionario = funcionarios.find(
                      (f) => f.id === item.funcionario_id
                    );
                    return (
                      <tr
                        key={item.funcionario_id}
                        className="hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="px-4 py-2.5 font-medium text-slate-100">
                          {item.funcionario_nome}
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-300">
                          R$ {item.total.toFixed(2).replace(".", ",")}
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium text-emerald-400">
                          R$ {(item.total * 0.4).toFixed(2).replace(".", ",")}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <span
                            className={`badge ${
                              funcionario?.ativo
                                ? "badge-success"
                                : "badge-neutral"
                            }`}
                          >
                            {funcionario?.ativo ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <Link
                            to={`/funcionarios/${item.funcionario_id}`}
                            className="text-indigo-400 hover:text-indigo-300 font-medium text-xs hover:underline"
                          >
                            Detalhes
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card h-fit">
            <div className="px-4 py-3 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
              <h3 className="font-semibold text-slate-100 text-sm">Equipe</h3>
              <Link
                to="/funcionarios/novo"
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                + Adicionar
              </Link>
            </div>
            <div className="p-2">
              <div className="space-y-0.5">
                {funcionarios.map((funcionario) => (
                  <Link
                    key={funcionario.id}
                    to={`/funcionarios/${funcionario.id}`}
                    className="flex items-center justify-between p-2 hover:bg-slate-800/50 rounded transition-colors group border border-transparent hover:border-slate-700"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          funcionario.ativo ? "bg-emerald-400" : "bg-slate-500"
                        }`}
                      ></div>
                      <span className="text-xs text-slate-300 font-medium group-hover:text-slate-100">
                        {funcionario.nome}
                      </span>
                    </div>
                    <svg
                      className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path d="M6 4l6 4-6 4V4z" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
