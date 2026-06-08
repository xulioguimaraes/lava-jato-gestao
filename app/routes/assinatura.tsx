import { json } from "@remix-run/node";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { requererUsuario } from "~/utils/session.server";
import { listarFaturas, getStripeClient, atualizarAssinaturaUsuario } from "~/utils/stripe.server";
import { BottomNav } from "~/components/dashboard/BottomNav";
import { pageTitle } from "~/utils/meta";

export const meta: MetaFunction = () => [
  { title: pageTitle("Assinatura") },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const usuario = await requererUsuario(request);

  let faturas: Array<{
    id: string;
    numero: string | null;
    valor: number;
    status: string;
    data: number;
    url: string | null;
  }> = [];

  if (usuario.stripe_customer_id) {
    try {
      const invoices = await listarFaturas(usuario.stripe_customer_id);
      faturas = invoices.map((inv) => ({
        id: inv.id,
        numero: inv.number,
        valor: inv.amount_paid,
        status: inv.status ?? "unknown",
        data: inv.created,
        url: inv.hosted_invoice_url ?? null,
      }));
    } catch {
      // silencia erros de API Stripe
    }
  }

  // Se billing_period_end estiver vazio mas tiver subscription, busca no Stripe e salva
  if (!usuario.billing_period_end && usuario.stripe_subscription_id) {
    try {
      const stripe = getStripeClient();
      const sub = await stripe.subscriptions.retrieve(usuario.stripe_subscription_id);
      const rawEnd = (sub as any).current_period_end;
      if (rawEnd) {
        const billing_period_end = new Date(rawEnd * 1000).toISOString();
        await atualizarAssinaturaUsuario(usuario.id, { billing_period_end });
        usuario.billing_period_end = billing_period_end;
      }
    } catch {
      // silencia erros
    }
  }

  return json({ usuario, faturas });
}

function formatarData(ts: number) {
  return new Date(ts * 1000).toLocaleDateString("pt-BR");
}

function formatarValor(centavos: number) {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

const statusBadge: Record<string, { label: string; color: string }> = {
  active: { label: "Ativo", color: "text-green-400 bg-green-900/30" },
  past_due: { label: "Vencido", color: "text-amber-400 bg-amber-900/30" },
  canceled: { label: "Cancelado", color: "text-red-400 bg-red-900/30" },
  free: { label: "Gratuito", color: "text-zinc-400 bg-zinc-800/50" },
};

const faturaBadge: Record<string, { label: string; color: string }> = {
  paid: { label: "Pago", color: "text-green-400 bg-green-900/30" },
  open: { label: "Aberto", color: "text-amber-400 bg-amber-900/30" },
  void: { label: "Cancelado", color: "text-red-400 bg-red-900/30" },
  uncollectible: { label: "Inadimplente", color: "text-red-400 bg-red-900/30" },
};

export default function Assinatura() {
  const { usuario, faturas } = useLoaderData<typeof loader>();

  const isPro =
    usuario.plan_type === "pro" && usuario.subscription_status === "active";
  const subStatus = usuario.subscription_status ?? "free";
  const badge = statusBadge[subStatus] ?? statusBadge.free;

  return (
    <div className="min-h-screen bg-deep pb-24 md:pb-8">
      <header
        className="sticky top-0 z-50 bg-deep px-4 py-3 flex items-center gap-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <Link
          to="/dashboard"
          className="w-8 h-8 rounded-md flex items-center justify-center hover-item"
          style={{ border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="font-display font-bold text-base tracking-tight">
            Assinatura
          </h1>
          <p
            className="font-mono-app"
            style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)" }}
          >
            Plano e faturamento
          </p>
        </div>
      </header>

      <main className="px-4 py-6 max-w-2xl mx-auto space-y-4">
        {/* Plano atual */}
        <div
          className="bg-surface rounded-md p-5"
          style={{ border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <h2
            className="font-mono-app uppercase tracking-[0.12em] mb-4"
            style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.4)" }}
          >
            Plano atual
          </h2>

          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-display font-bold text-xl">
                {isPro ? "Pro" : "Gratuito"}
              </p>
              {isPro && usuario.billing_period_end && (
                <p
                  className="font-mono-app mt-0.5"
                  style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}
                >
                  Renova em{" "}
                  {new Date(usuario.billing_period_end).toLocaleDateString("pt-BR")}
                </p>
              )}
            </div>
            <span
              className={`font-mono-app text-xs px-2 py-0.5 rounded ${badge.color}`}
            >
              {badge.label}
            </span>
          </div>

          {/* Limites */}
          <div
            className="rounded p-3 mb-4 space-y-1"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <LimiteRow
              label="Funcionários"
              valor={isPro ? "Ilimitado" : "1"}
              ativo={isPro}
            />
            <LimiteRow
              label="Lavagens por mês"
              valor={isPro ? "Ilimitado" : "20"}
              ativo={isPro}
            />
          </div>

          {/* Ações */}
          {!isPro && (
            <Form method="post" action="/assinatura/checkout">
              <button
                type="submit"
                className="w-full py-2.5 rounded font-mono-app text-sm font-medium"
                style={{ background: "#4D7C5F", color: "#0C0C0C" }}
              >
                Assinar Plano Pro
              </button>
            </Form>
          )}

          {isPro && usuario.stripe_customer_id && (
            <Form method="post" action="/assinatura/portal">
              <button
                type="submit"
                className="w-full py-2.5 rounded font-mono-app text-sm font-medium hover-item"
                style={{
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                Gerenciar faturamento
              </button>
            </Form>
          )}
        </div>

        {/* Histórico de faturas */}
        {faturas.length > 0 && (
          <div
            className="bg-surface rounded-md p-5"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <h2
              className="font-mono-app uppercase tracking-[0.12em] mb-4"
              style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.4)" }}
            >
              Histórico de faturas
            </h2>
            <div className="space-y-2">
              {faturas.map((fatura) => {
                const fb = faturaBadge[fatura.status] ?? {
                  label: fatura.status,
                  color: "text-zinc-400 bg-zinc-800/50",
                };
                return (
                  <div
                    key={fatura.id}
                    className="flex items-center justify-between py-2"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    <div>
                      <p
                        className="font-mono-app text-sm"
                        style={{ color: "rgba(255,255,255,0.85)" }}
                      >
                        {formatarData(fatura.data)}
                        {fatura.numero && (
                          <span
                            className="ml-2"
                            style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.7rem" }}
                          >
                            #{fatura.numero}
                          </span>
                        )}
                      </p>
                      <p
                        className="font-mono-app"
                        style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}
                      >
                        {formatarValor(fatura.valor)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono-app text-xs px-2 py-0.5 rounded ${fb.color}`}
                      >
                        {fb.label}
                      </span>
                      {fatura.url && (
                        <a
                          href={fatura.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono-app text-xs hover-item"
                          style={{ color: "rgba(255,255,255,0.35)" }}
                        >
                          Ver
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {faturas.length === 0 && !isPro && (
          <div
            className="bg-surface rounded-md p-5 text-center"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p
              className="font-mono-app text-sm"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              Nenhuma fatura ainda.
            </p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function LimiteRow({
  label,
  valor,
  ativo,
}: {
  label: string;
  valor: string;
  ativo: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className="font-mono-app text-xs"
        style={{ color: "rgba(255,255,255,0.5)" }}
      >
        {label}
      </span>
      <span
        className="font-mono-app text-xs font-medium"
        style={{ color: ativo ? "#4D7C5F" : "rgba(255,255,255,0.7)" }}
      >
        {valor}
      </span>
    </div>
  );
}
