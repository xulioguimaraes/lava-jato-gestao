import { redirect } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { requererUsuario } from "~/utils/session.server";
import { criarPortalSession } from "~/utils/stripe.server";

export async function action({ request }: ActionFunctionArgs) {
  const usuario = await requererUsuario(request);

  if (!usuario.stripe_customer_id) {
    return redirect("/assinatura");
  }

  const origin = new URL(request.url).origin;
  const portalUrl = await criarPortalSession(
    usuario.stripe_customer_id,
    `${origin}/assinatura`
  );

  return redirect(portalUrl);
}

export async function loader() {
  return redirect("/assinatura");
}
