import { json } from "@remix-run/node";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { listarFuncionarios } from "~/utils/funcionarios.server";
import { pageTitle } from "~/utils/meta";
import { buscarUsuarioPorSlug } from "~/utils/auth.server";

export const meta: MetaFunction = ({ params }) => [
  { title: pageTitle(params.slug || "Funcionários") },
  {
    name: "description",
    content: "Selecione seu nome para registrar lavagens - X Lava Jato",
  },
];

export async function loader({ params }: LoaderFunctionArgs) {
  const slug = params.slug;
  if (!slug) {
    throw new Response("Slug não informado", { status: 400 });
  }

  const usuario = await buscarUsuarioPorSlug(slug);
  if (!usuario) {
    throw new Response("Página não encontrada", { status: 404 });
  }

  const funcionarios = await listarFuncionarios(usuario.id, true);
  return json({
    funcionarios,
    usuario,
  });
}

export default function FuncionariosPublicoSlug() {
  const { funcionarios, usuario } = useLoaderData<typeof loader>();
  const nomeNegocio = usuario.nome_negocio || "Lava Jato Gestão";

  return (
    <div className="min-h-screen bg-deep flex items-center justify-center px-4 py-12">
      <div
        className="w-full max-w-[640px] bg-surface rounded-md p-8"
        style={{ border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-10 h-10 rounded-md flex items-center justify-center mb-4"
            style={{ background: "rgba(77,124,95,0.15)" }}
          >
            <svg
              className="w-5 h-5"
              style={{ color: "#4D7C5F" }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="5" rx="1" />
              <rect x="14" y="12" width="7" height="9" rx="1" />
              <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
          </div>
          <h1 className="font-display font-extrabold text-xl tracking-tight">
            {nomeNegocio}
          </h1>
          <p
            className="font-mono-app mt-2"
            style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.35)" }}
          >
            Selecione seu nome para registrar suas lavagens
          </p>
        </div>

        {funcionarios.length === 0 ? (
          <div className="text-center py-8">
            <div
              className="w-10 h-10 rounded-md flex items-center justify-center mx-auto mb-3"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <svg
                className="w-5 h-5"
                style={{ color: "rgba(255,255,255,0.3)" }}
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
            <p
              className="font-mono-app"
              style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.35)" }}
            >
              Nenhum funcionário cadastrado
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {funcionarios.map((funcionario) => (
              <Link
                key={funcionario.id}
                to={`/funcionario/publico/${funcionario.id}`}
                className="block bg-surface rounded-md px-5 py-4 hover-item group"
                style={{ border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center"
                    style={{ background: "rgba(77,124,95,0.15)" }}
                  >
                    <svg
                      className="w-4 h-4"
                      style={{ color: "#4D7C5F" }}
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="font-display font-bold text-sm">
                    {funcionario.nome}
                  </span>
                </div>
                <span
                  className="font-mono-app flex items-center gap-1"
                  style={{ fontSize: "0.75rem", color: "#4D7C5F" }}
                >
                  Registrar lavagens
                  <span className="ml-0.5 transition-transform duration-150 group-hover:translate-x-0.5">
                    →
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
