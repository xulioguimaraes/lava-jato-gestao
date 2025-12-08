import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { listarFuncionarios } from "~/utils/funcionarios.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const funcionarios = await listarFuncionarios();
  return json({ funcionarios: funcionarios.filter((f) => f.ativo) });
}

export default function FuncionariosPublico() {
  const { funcionarios } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-slate-900 py-4 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto">
        <div className="card p-4">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-indigo-900/30 rounded-lg mb-3">
              <svg className="w-5 h-5 text-indigo-400" viewBox="0 0 16 16" fill="currentColor">
                <rect x="2" y="2" width="5" height="5" rx="0.5"/>
                <rect x="9" y="2" width="5" height="5" rx="0.5"/>
                <rect x="2" y="9" width="5" height="5" rx="0.5"/>
                <rect x="9" y="9" width="5" height="5" rx="0.5"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-100 mb-1">
              Lava Jato Gestão
            </h1>
            <p className="text-slate-400 text-sm">
              Selecione seu nome para registrar suas lavagens
            </p>
          </div>
          
          {funcionarios.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                  <circle cx="10" cy="6" r="3"/>
                  <path d="M4 16c0-2.5 2.5-4.5 6-4.5s6 2 6 4.5v1H4v-1z"/>
                </svg>
              </div>
              <p className="text-slate-400 text-sm">Nenhum funcionário cadastrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {funcionarios.map((funcionario) => (
                <Link
                  key={funcionario.id}
                  to={`/funcionario/publico/${funcionario.id}`}
                  className="group border-2 border-slate-700 rounded-lg p-3 hover:border-indigo-500 hover:bg-slate-800/50 transition-all duration-200"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-indigo-900/30 group-hover:bg-indigo-900/50 rounded-lg flex items-center justify-center transition-colors">
                      <svg className="w-4 h-4 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                        <circle cx="10" cy="6" r="3"/>
                        <path d="M4 16c0-2.5 2.5-4.5 6-4.5s6 2 6 4.5v1H4v-1z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                        {funcionario.nome}
                      </h3>
                      {funcionario.email && (
                        <p className="text-xs text-slate-400 mt-0.5">{funcionario.email}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center text-indigo-400 font-medium text-sm group-hover:text-indigo-300">
                    <span>Registrar lavagens</span>
                    <svg className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

