import { json } from "@remix-run/node";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { requererUsuario } from "~/utils/session.server";
import { listarFuncionarios } from "~/utils/funcionarios.server";
import { pageTitle } from "~/utils/meta";

export const meta: MetaFunction = () => [
  { title: pageTitle("Equipe") },
  {
    name: "description",
    content: "Lista de funcionários - X Lava Jato",
  },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const usuario = await requererUsuario(request);
  const funcionarios = await listarFuncionarios(usuario.id);
  return json({ funcionarios });
}

export default function EquipePage() {
  const { funcionarios } = useLoaderData<typeof loader>();

  const ativos = funcionarios.filter((f) => f.ativo);
  const inativos = funcionarios.filter((f) => !f.ativo);

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center gap-2">
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
                  Equipe
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  {funcionarios.length} funcionário
                  {funcionarios.length !== 1 ? "s" : ""} cadastrado
                  {funcionarios.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <Link
              to="/funcionarios/novo"
              className="btn-primary text-xs py-1.5 px-3 h-auto min-h-0"
            >
              + Novo Funcionário
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4">
        <div className="space-y-4">
          {ativos.length > 0 && (
            <div className="card p-4">
              <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Ativos ({ativos.length})
              </h2>
              <div className="space-y-2">
                {ativos.map((funcionario) => (
                  <Link
                    key={funcionario.id}
                    to={`/funcionarios/${funcionario.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-700 hover:border-indigo-500 hover:bg-slate-800/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-900/30 flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-emerald-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-slate-100 group-hover:text-indigo-300 transition-colors">
                          {funcionario.nome}
                        </p>
                        {funcionario.email && (
                          <p className="text-xs text-slate-400">
                            {funcionario.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <svg
                      className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path d="M6 4l6 4-6 4V4z" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {inativos.length > 0 && (
            <div className="card p-4">
              <h2 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                Inativos ({inativos.length})
              </h2>
              <div className="space-y-2">
                {inativos.map((funcionario) => (
                  <Link
                    key={funcionario.id}
                    to={`/funcionarios/${funcionario.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-700 hover:border-slate-600 hover:bg-slate-800/50 transition-colors group opacity-75"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-slate-500"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-slate-300 group-hover:text-slate-200 transition-colors">
                          {funcionario.nome}
                        </p>
                        {funcionario.email && (
                          <p className="text-xs text-slate-500">
                            {funcionario.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <svg
                      className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path d="M6 4l6 4-6 4V4z" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {funcionarios.length === 0 && (
            <div className="card p-12 text-center">
              <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-slate-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="text-slate-400 text-sm mb-4">
                Nenhum funcionário cadastrado
              </p>
              <Link
                to="/funcionarios/novo"
                className="btn-primary text-sm inline-flex"
              >
                + Adicionar primeiro funcionário
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
