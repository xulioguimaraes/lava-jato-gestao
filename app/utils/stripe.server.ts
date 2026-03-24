import Stripe from "stripe";
import { db } from "~/db/turso.server";

export function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY não configurado");
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

export async function criarOuBuscarClienteStripe(
  email: string,
  nome: string
): Promise<string> {
  const stripe = getStripeClient();
  const existing = await stripe.customers.list({ email, limit: 1 });
  if (existing.data.length > 0) return existing.data[0].id;
  const customer = await stripe.customers.create({ email, name: nome });
  return customer.id;
}

export async function criarCheckoutSession(
  userId: string,
  stripeCustomerId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const stripe = getStripeClient();
  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) throw new Error("STRIPE_PRO_PRICE_ID não configurado");

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId },
    subscription_data: { metadata: { userId } },
  });

  return session.url!;
}

export async function criarPortalSession(
  stripeCustomerId: string,
  returnUrl: string
): Promise<string> {
  const stripe = getStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });
  return session.url;
}

export async function listarFaturas(
  stripeCustomerId: string
): Promise<Stripe.Invoice[]> {
  const stripe = getStripeClient();
  const invoices = await stripe.invoices.list({
    customer: stripeCustomerId,
    limit: 10,
  });
  return invoices.data;
}

export async function atualizarAssinaturaUsuario(
  userId: string,
  dados: {
    stripe_customer_id?: string;
    stripe_subscription_id?: string | null;
    subscription_status?: string;
    plan_type?: string;
    billing_period_end?: string | null;
  }
) {
  const sets: string[] = [];
  const args: (string | null)[] = [];

  for (const [key, value] of Object.entries(dados)) {
    if (value !== undefined) {
      sets.push(`${key} = ?`);
      args.push(value as string | null);
    }
  }

  if (sets.length === 0) return;

  args.push(userId);
  await db.execute({
    sql: `UPDATE usuarios SET ${sets.join(", ")} WHERE id = ?`,
    args,
  });
}

export async function construirWebhookEvento(
  payload: string,
  signature: string
): Promise<Stripe.Event> {
  const stripe = getStripeClient();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET não configurado");
  return stripe.webhooks.constructEvent(payload, signature, secret);
}
