import { redirect } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { obterUsuario } from "~/utils/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const usuario = await obterUsuario(request);
  
  if (usuario) {
    return redirect("/dashboard");
  }
  
  return redirect("/login");
}

