import { redirect } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { requererUsuario } from "~/utils/session.server";
import {
  criarOuBuscarClienteStripe,
  criarCheckoutSession,
  atualizarAssinaturaUsuario,
} from "~/utils/stripe.server";

export async function action({ request }: ActionFunctionArgs) {
  const usuario = await requererUsuario(request);
  const origin = new URL(request.url).origin;

  const stripeCustomerId =
    usuario.stripe_customer_id ??
    (await criarOuBuscarClienteStripe(usuario.email, usuario.nome));

  if (!usuario.stripe_customer_id) {
    await atualizarAssinaturaUsuario(usuario.id, {
      stripe_customer_id: stripeCustomerId,
    });
  }

  const checkoutUrl = await criarCheckoutSession(
    usuario.id,
    stripeCustomerId,
    `${origin}/assinatura?sucesso=1`,
    `${origin}/assinatura?cancelado=1`
  );

  return redirect(checkoutUrl);
}

export async function loader() {
  return redirect("/assinatura");
}
