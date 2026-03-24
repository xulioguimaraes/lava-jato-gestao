import type { ActionFunctionArgs } from "@remix-run/node";
import { construirWebhookEvento, atualizarAssinaturaUsuario, getStripeClient } from "~/utils/stripe.server";
import { db } from "~/db/turso.server";
import {
  enviarEmailAssinaturaConfirmada,
  enviarEmailAssinaturaCancelada,
  enviarEmailPagamentoFalhou,
  enviarEmailRenovacao,
} from "~/utils/email.server";
import type Stripe from "stripe";

async function buscarUsuarioPorId(
  userId: string
): Promise<{ email: string; nome: string } | null> {
  const result = await db.execute({
    sql: "SELECT email, nome FROM usuarios WHERE id = ? LIMIT 1",
    args: [userId],
  });
  if (result.rows.length === 0) return null;
  return {
    email: result.rows[0].email as string,
    nome: result.rows[0].nome as string,
  };
}

async function buscarUsuarioPorCustomerId(
  customerId: string
): Promise<{ id: string; email: string; nome: string } | null> {
  const result = await db.execute({
    sql: "SELECT id, email, nome FROM usuarios WHERE stripe_customer_id = ? LIMIT 1",
    args: [customerId],
  });
  if (result.rows.length === 0) return null;
  return {
    id: result.rows[0].id as string,
    email: result.rows[0].email as string,
    nome: result.rows[0].nome as string,
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Assinatura ausente", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await construirWebhookEvento(payload, signature);
  } catch {
    return new Response("Assinatura inválida", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        if (!userId || !session.subscription) break;

        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id;

        const stripe = getStripeClient();
        const sub = await stripe.subscriptions.retrieve(subId);
        const rawEnd = (sub as any).current_period_end;
        const billingPeriodEnd = rawEnd
          ? new Date(rawEnd * 1000).toISOString()
          : null;
        const dataRenovacao = rawEnd
          ? new Date(rawEnd * 1000).toLocaleDateString("pt-BR")
          : "—";

        await atualizarAssinaturaUsuario(userId, {
          stripe_subscription_id: subId,
          subscription_status: "active",
          plan_type: "pro",
          billing_period_end: billingPeriodEnd,
        });

        const usuario = await buscarUsuarioPorId(userId);
        if (usuario) {
          try {
            await enviarEmailAssinaturaConfirmada(usuario.email, usuario.nome, dataRenovacao);
            console.log(`[webhook] Email de confirmação enviado para ${usuario.email}`);
          } catch (emailErr) {
            console.error("[webhook] Falha ao enviar email de confirmação:", emailErr);
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId =
          typeof sub.customer === "string" ? sub.customer : (sub.customer as any)?.id;

        const metaUserId = sub.metadata?.userId;
        let resolvedUserId: string | null = null;
        let usuarioEmail: { email: string; nome: string } | null = null;

        if (metaUserId) {
          resolvedUserId = metaUserId;
          usuarioEmail = await buscarUsuarioPorId(metaUserId);
        } else if (customerId) {
          const u = await buscarUsuarioPorCustomerId(customerId);
          if (u) {
            resolvedUserId = u.id;
            usuarioEmail = u;
          }
        }

        if (!resolvedUserId) break;

        const rawPeriodEnd = (sub as any).current_period_end;
        const periodEnd = rawPeriodEnd
          ? new Date(rawPeriodEnd * 1000).toISOString()
          : null;

        const isRenovacao =
          sub.status === "active" &&
          (event.data.previous_attributes as any)?.current_period_end !== undefined;

        await atualizarAssinaturaUsuario(resolvedUserId, {
          subscription_status: sub.status,
          plan_type: sub.status === "active" ? "pro" : "free",
          billing_period_end: periodEnd,
        });

        if (isRenovacao && usuarioEmail) {
          const dataRenovacao = new Date(
            (sub as any).current_period_end * 1000
          ).toLocaleDateString("pt-BR");
          await enviarEmailRenovacao(usuarioEmail.email, usuarioEmail.nome, dataRenovacao);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId =
          typeof sub.customer === "string" ? sub.customer : (sub.customer as any)?.id;

        const userId = sub.metadata?.userId;
        let usuarioAlvo: { id: string; email: string; nome: string } | null = null;

        if (userId) {
          const u = await buscarUsuarioPorId(userId);
          if (u) usuarioAlvo = { id: userId, ...u };
        } else if (customerId) {
          usuarioAlvo = await buscarUsuarioPorCustomerId(customerId);
        }

        if (!usuarioAlvo) break;

        await atualizarAssinaturaUsuario(usuarioAlvo.id, {
          stripe_subscription_id: null,
          subscription_status: "canceled",
          plan_type: "free",
          billing_period_end: null,
        });

        await enviarEmailAssinaturaCancelada(usuarioAlvo.email, usuarioAlvo.nome);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : (invoice.customer as Stripe.Customer)?.id;

        if (!customerId) break;

        const usuario = await buscarUsuarioPorCustomerId(customerId);
        if (!usuario) break;

        await atualizarAssinaturaUsuario(usuario.id, {
          subscription_status: "past_due",
        });

        await enviarEmailPagamentoFalhou(usuario.email, usuario.nome);
        break;
      }
    }
  } catch (err) {
    console.error(`[webhook] Erro no evento ${event.type}:`, err);
    return new Response("Erro interno", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
