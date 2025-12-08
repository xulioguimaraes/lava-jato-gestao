import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { buscarFuncionarioPorId } from "~/utils/funcionarios.server";
import { listarLavagensPorFuncionario, calcularComissaoFuncionario } from "~/utils/lavagens.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const funcionario = await buscarFuncionarioPorId(params.id!);
  if (!funcionario) {
    throw new Response("Funcionário não encontrado", { status: 404 });
  }

  const [lavagens, comissao] = await Promise.all([
    listarLavagensPorFuncionario(funcionario.id),
    calcularComissaoFuncionario(funcionario.id),
  ]);

  return json({ funcionario, lavagens, comissao });
}

export default function PerfilFuncionario() {
  const { funcionario, lavagens, comissao } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-3">
          <div className="flex items-center gap-2.5">
            <Link
              to="/funcionarios/publico"
              className="w-7 h-7 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10 12l-4-4 4-4"/>
              </svg>
            </Link>
            <div>
              <h1 className="text-base font-semibold text-slate-100 leading-none">{funcionario.nome}</h1>
              <p className="text-xs text-slate-400 mt-0.5">Seu perfil e resumo da semana</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4">
        <div className="card p-4">

          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="bg-blue-900/30 rounded-lg p-3 border border-blue-800">
              <h3 className="text-xs font-medium text-blue-400 mb-1">
                Total Lavado
              </h3>
              <p className="text-lg font-bold text-blue-300">
                R$ {comissao.total.toFixed(2).replace(".", ",")}
              </p>
            </div>
            <div className="bg-emerald-900/30 rounded-lg p-3 border border-emerald-800">
              <h3 className="text-xs font-medium text-emerald-400 mb-1">
                Sua Comissão (40%)
              </h3>
              <p className="text-lg font-bold text-emerald-300">
                R$ {comissao.comissao.toFixed(2).replace(".", ",")}
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
              <h3 className="text-xs font-medium text-slate-400 mb-1">
                Lavagens
              </h3>
              <p className="text-lg font-bold text-slate-100">{lavagens.length}</p>
            </div>
          </div>

          {/* Botão para nova lavagem */}
          <div className="mb-4">
            <Link
              to={`/funcionarios/${funcionario.id}/lavagem`}
              className="btn-primary inline-block"
            >
              + Registrar Nova Lavagem
            </Link>
          </div>

          {/* Lista de Lavagens */}
          <div>
            <h2 className="text-base font-semibold text-slate-100 mb-3">
              Lavagens da Semana
            </h2>
            {lavagens.length === 0 ? (
              <div className="text-center py-8 bg-slate-800/50 rounded-lg border border-slate-700">
                <p className="text-slate-400 mb-3 text-sm">
                  Você ainda não registrou nenhuma lavagem esta semana
                </p>
                <Link
                  to={`/funcionarios/${funcionario.id}/lavagem`}
                  className="btn-primary inline-block"
                >
                  Registrar Primeira Lavagem
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {lavagens.map((lavagem) => (
                  <div
                    key={lavagem.id}
                    className="border border-slate-700 rounded-lg p-3 hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-slate-100 text-sm">
                          {lavagem.descricao}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(lavagem.data_lavagem).toLocaleDateString("pt-BR", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-100 text-sm">
                          R$ {lavagem.preco.toFixed(2).replace(".", ",")}
                        </p>
                        <p className="text-xs text-emerald-400 mt-0.5">
                          Comissão: R$ {(lavagem.preco * 0.4).toFixed(2).replace(".", ",")}
                        </p>
                      </div>
                    </div>
                    {lavagem.foto_url && (
                      <img
                        src={lavagem.foto_url}
                        alt={lavagem.descricao}
                        className="mt-2 rounded-md w-full max-w-xs h-24 object-cover border border-slate-700"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Link para voltar */}
          <div className="mt-4 text-center">
            <Link
              to="/funcionarios/publico"
              className="text-indigo-400 hover:text-indigo-300 text-sm"
            >
              ← Voltar para lista de funcionários
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

