import { redirect } from "@remix-run/node";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { obterUsuario } from "~/utils/session.server";
import { pageTitle } from "~/utils/meta";

export const meta: MetaFunction = () => [
  { title: pageTitle("Início") },
  { name: "description", content: "X Lava Jato - Redirecionamento inicial" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const usuario = await obterUsuario(request);

  if (usuario) {
    return redirect("/dashboard");
  }

  return redirect("/login");
}
