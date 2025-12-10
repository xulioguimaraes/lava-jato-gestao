import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useNavigation, Link } from "@remix-run/react";
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
  buscarLavagemPorId,
} from "~/utils/lavagens.server";
import { useState } from "react";
import { formatDatePtBr } from "~/utils/date";

export async function loader({ request, params }: LoaderFunctionArgs) {
  await requererUsuario(request);

  const funcionario = await buscarFuncionarioPorId(params.id!);
  if (!funcionario) {
    throw new Response("Funcionário não encontrado", { status: 404 });
  }

  // Não trazer fotos para evitar payload grande
  const [lavagens, comissao] = await Promise.all([
    listarLavagensPorFuncionario(funcionario.id, 0, false),
    calcularComissaoFuncionario(funcionario.id),
  ]);

  return json({ funcionario, lavagens, comissao });
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
        { status: 400 }
      );
    }
    await atualizarFuncionario(
      params.id!,
      nome,
      undefined,
      telefone,
      ativo,
      porcentagem
    );
    return redirect(`/funcionarios/${params.id}`);
  }

  if (intent === "updateLavagem") {
    const lavagemId = formData.get("lavagemId") as string;
    const descricao = formData.get("descricao") as string;
    const preco = formData.get("preco") as string;
    const dataLavagem = formData.get("data_lavagem") as string;
    const foto = formData.get("foto") as File | null;

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

    let fotoUrl: string | null = null;
    if (foto && foto.size > 0) {
      const arrayBuffer = await foto.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString("base64");
      fotoUrl = `data:${foto.type};base64,${base64}`;
    } else {
      // Se não enviou nova foto, manter a foto existente
      const lavagemExistente = await buscarLavagemPorId(lavagemId);
      if (lavagemExistente) {
        fotoUrl = lavagemExistente.foto_url;
      }
    }

    await atualizarLavagem(
      lavagemId,
      descricao,
      precoNum,
      fotoUrl,
      dataLavagem
    );
    return redirect(`/funcionarios/${params.id}`);
  }

  if (intent === "deleteLavagem") {
    const lavagemId = formData.get("lavagemId") as string;
    await excluirLavagem(lavagemId);
    return redirect(`/funcionarios/${params.id}`);
  }

  return null;
}

export default function FuncionarioDetalhes() {
  const { funcionario, lavagens, comissao } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [isEditing, setIsEditing] = useState(false);
  const [editingLavagemId, setEditingLavagemId] = useState<string | null>(null);

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
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-3">
          <div className="flex items-center gap-2.5">
            <Link
              to="/dashboard"
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
                Detalhes do funcionário
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4">
        <div className="card p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  Editar
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(false)}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>

          {!isEditing ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-400 mb-1">Nome</p>
                <p className="text-sm font-medium text-slate-100">
                  {funcionario.nome}
                </p>
              </div>
              {funcionario.telefone && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">Telefone</p>
                  <a
                    href={formatarTelefoneWhatsApp(funcionario.telefone) || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                    {funcionario.telefone}
                  </a>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-400 mb-1">Status</p>
                <span
                  className={`badge ${
                    funcionario.ativo === 1 ? "badge-success" : "badge-neutral"
                  }`}
                >
                  {funcionario.ativo === 1 ? "Ativo" : "Inativo"}
                </span>
              </div>
            </div>
          ) : (
            <Form method="post" className="space-y-3">
              <input type="hidden" name="intent" value="update" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="nome"
                    className="block text-xs font-medium text-slate-300 mb-1"
                  >
                    Nome *
                  </label>
                  <input
                    type="text"
                    id="nome"
                    name="nome"
                    defaultValue={funcionario.nome}
                    required
                    className="input-field"
                  />
                </div>
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
                    defaultValue={funcionario.telefone || ""}
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
                      defaultValue={funcionario.porcentagem_comissao || 40}
                      min="0"
                      max="100"
                      step="0.1"
                      className="input-field pr-8"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                      %
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Valor padrão: 40%
                  </p>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="ativo"
                    name="ativo"
                    defaultChecked={funcionario.ativo === 1}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-600 rounded bg-slate-800"
                  />
                  <label
                    htmlFor="ativo"
                    className="ml-2 block text-xs text-slate-300"
                  >
                    Ativo
                  </label>
                </div>
              </div>
              <div className="flex gap-2 pt-2 border-t border-slate-700">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                >
                  {isSubmitting ? "Salvando..." : "Salvar Alterações"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </Form>
          )}
        </div>

        {/* Resumo da Semana */}
        <div className="card p-4 mb-4">
          <h2 className="text-base font-semibold text-slate-100 mb-3">
            Resumo da Semana
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-400">Total Lavado</p>
              <p className="text-lg font-bold text-slate-100">
                R$ {comissao.total.toFixed(2).replace(".", ",")}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">
                Comissão ({comissao.porcentagem || 40}%)
              </p>
              <p className="text-lg font-bold text-emerald-400">
                R$ {comissao.comissao.toFixed(2).replace(".", ",")}
              </p>
            </div>
          </div>
        </div>

        {/* Lavagens */}
        <div className="card p-4">
          <h2 className="text-base font-semibold text-slate-100 mb-3">
            Lavagens da Semana
          </h2>
          {lavagens.length === 0 ? (
            <p className="text-slate-400 text-center py-6 text-sm">
              Nenhuma lavagem registrada esta semana
            </p>
          ) : (
            <div className="space-y-3">
              {lavagens.map((lavagem) => (
                <div
                  key={lavagem.id}
                  className="border border-slate-700 rounded-lg p-3 hover:bg-slate-800/50 transition-colors"
                >
                  {editingLavagemId === lavagem.id ? (
                    <Form
                      method="post"
                      encType="multipart/form-data"
                      className="space-y-3"
                    >
                      <input
                        type="hidden"
                        name="intent"
                        value="updateLavagem"
                      />
                      <input
                        type="hidden"
                        name="lavagemId"
                        value={lavagem.id}
                      />

                      <div>
                        <label
                          htmlFor={`descricao-${lavagem.id}`}
                          className="block text-xs font-medium text-slate-300 mb-1"
                        >
                          Descrição *
                        </label>
                        <input
                          type="text"
                          id={`descricao-${lavagem.id}`}
                          name="descricao"
                          defaultValue={lavagem.descricao}
                          required
                          className="input-field"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label
                            htmlFor={`preco-${lavagem.id}`}
                            className="block text-xs font-medium text-slate-300 mb-1"
                          >
                            Preço (R$) *
                          </label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                              R$
                            </span>
                            <input
                              type="number"
                              id={`preco-${lavagem.id}`}
                              name="preco"
                              defaultValue={lavagem.preco}
                              step="0.01"
                              min="0.01"
                              required
                              className="input-field pl-8"
                            />
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor={`data-${lavagem.id}`}
                            className="block text-xs font-medium text-slate-300 mb-1"
                          >
                            Data *
                          </label>
                          <input
                            type="date"
                            id={`data-${lavagem.id}`}
                            name="data_lavagem"
                            defaultValue={lavagem.data_lavagem}
                            required
                            className="input-field"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor={`foto-${lavagem.id}`}
                          className="block text-xs font-medium text-slate-300 mb-1"
                        >
                          Nova Foto (opcional)
                        </label>
                        <input
                          type="file"
                          id={`foto-${lavagem.id}`}
                          name="foto"
                          accept="image/*"
                          className="input-field text-xs"
                        />
                        {lavagem.foto_url && (
                          <p className="text-xs text-slate-500 mt-1">
                            Deixe em branco para manter a foto atual
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-slate-700">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="btn-primary text-xs"
                        >
                          {isSubmitting ? "Salvando..." : "Salvar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingLavagemId(null)}
                          className="btn-secondary text-xs"
                        >
                          Cancelar
                        </button>
                      </div>
                    </Form>
                  ) : (
                    <>
                      <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-slate-100 text-sm">
                          {lavagem.descricao}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {formatDatePtBr(lavagem.data_lavagem)}
                          {lavagem.forma_pagamento && (
                            <>
                              {" "}
                              • Forma:{" "}
                              {lavagem.forma_pagamento === "pix" ? "Pix" : "Dinheiro"}
                            </>
                          )}
                        </p>
                      </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-100 text-sm">
                            R$ {lavagem.preco.toFixed(2).replace(".", ",")}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700">
                        <button
                          onClick={() => setEditingLavagemId(lavagem.id)}
                          className="btn-secondary text-xs py-1 px-2"
                        >
                          Editar
                        </button>
                        <Form method="post" className="inline">
                          <input
                            type="hidden"
                            name="intent"
                            value="deleteLavagem"
                          />
                          <input
                            type="hidden"
                            name="lavagemId"
                            value={lavagem.id}
                          />
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn-danger text-xs py-1 px-2"
                            onClick={(e) => {
                              if (
                                !confirm(
                                  "Tem certeza que deseja excluir esta lavagem?"
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
  );
}
