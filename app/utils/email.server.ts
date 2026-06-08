import { Resend } from "resend";

function getResendClient(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY não configurado");
  return new Resend(key);
}

function getRemetente(): string {
  return process.env.RESEND_FROM ?? "onboarding@resend.dev";
}

function layoutEmail(conteudo: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { margin: 0; padding: 0; background: #0C0C0C; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
    .container { max-width: 520px; margin: 40px auto; background: #161616; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; overflow: hidden; }
    .header { padding: 28px 32px 20px; border-bottom: 1px solid rgba(255,255,255,0.07); }
    .logo { font-size: 13px; font-weight: 700; color: #4D7C5F; letter-spacing: 0.12em; text-transform: uppercase; }
    .body { padding: 28px 32px; }
    h1 { margin: 0 0 12px; font-size: 20px; font-weight: 700; color: #F0F0F0; line-height: 1.3; }
    p { margin: 0 0 16px; font-size: 14px; color: rgba(255,255,255,0.6); line-height: 1.6; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }
    .badge-green { background: rgba(77,124,95,0.2); color: #4D7C5F; }
    .badge-red { background: rgba(220,60,60,0.15); color: #e06060; }
    .badge-yellow { background: rgba(200,160,40,0.15); color: #c8a830; }
    .divider { border: none; border-top: 1px solid rgba(255,255,255,0.07); margin: 20px 0; }
    .footer { padding: 16px 32px 24px; }
    .footer p { font-size: 11px; color: rgba(255,255,255,0.25); margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="logo">Lava Jato Gestão</span>
    </div>
    <div class="body">
      ${conteudo}
    </div>
    <hr class="divider" />
    <div class="footer">
      <p>Você está recebendo este email pois tem uma conta no Lava Jato Gestão.</p>
    </div>
  </div>
</body>
</html>`;
}

export async function enviarEmailAssinaturaConfirmada(
  para: string,
  nome: string,
  dataRenovacao: string
): Promise<void> {
  const resend = getResendClient();
  const html = layoutEmail(`
    <span class="badge badge-green">Plano Pro ativo</span>
    <h1 style="margin-top:14px;">Assinatura confirmada!</h1>
    <p>Olá, <strong style="color:#F0F0F0;">${nome}</strong>. Seu plano Pro está ativo e você agora tem acesso a funcionários e lavagens ilimitados.</p>
    <p>Próxima cobrança: <strong style="color:#F0F0F0;">${dataRenovacao}</strong>.</p>
    <p>Para gerenciar sua assinatura acesse <strong style="color:#4D7C5F;">Configurações → Assinatura</strong> no painel.</p>
  `);

  await resend.emails.send({
    from: getRemetente(),
    to: para,
    subject: "Assinatura Pro confirmada — Lava Jato Gestão",
    html,
  });
}

export async function enviarEmailAssinaturaCancelada(
  para: string,
  nome: string
): Promise<void> {
  const resend = getResendClient();
  const html = layoutEmail(`
    <span class="badge badge-red">Assinatura encerrada</span>
    <h1 style="margin-top:14px;">Sua assinatura foi cancelada</h1>
    <p>Olá, <strong style="color:#F0F0F0;">${nome}</strong>. Sua assinatura Pro foi cancelada e sua conta voltou ao plano Gratuito.</p>
    <p>No plano Gratuito você pode ter até <strong style="color:#F0F0F0;">1 funcionário</strong> e registrar até <strong style="color:#F0F0F0;">20 lavagens por mês</strong>.</p>
    <p>Se mudar de ideia, você pode reativar o plano Pro a qualquer momento pelo painel.</p>
  `);

  await resend.emails.send({
    from: getRemetente(),
    to: para,
    subject: "Assinatura cancelada — Lava Jato Gestão",
    html,
  });
}

export async function enviarEmailPagamentoFalhou(
  para: string,
  nome: string
): Promise<void> {
  const resend = getResendClient();
  const html = layoutEmail(`
    <span class="badge badge-yellow">Atenção necessária</span>
    <h1 style="margin-top:14px;">Problema no pagamento</h1>
    <p>Olá, <strong style="color:#F0F0F0;">${nome}</strong>. Não conseguimos processar o pagamento da sua assinatura Pro.</p>
    <p>Para evitar a interrupção do serviço, atualize seu método de pagamento pelo painel de faturamento.</p>
    <p>Acesse <strong style="color:#4D7C5F;">Configurações → Assinatura → Gerenciar faturamento</strong> para resolver.</p>
  `);

  await resend.emails.send({
    from: getRemetente(),
    to: para,
    subject: "Falha no pagamento — Lava Jato Gestão",
    html,
  });
}

export async function enviarEmailRenovacao(
  para: string,
  nome: string,
  dataRenovacao: string
): Promise<void> {
  const resend = getResendClient();
  const html = layoutEmail(`
    <span class="badge badge-green">Renovação confirmada</span>
    <h1 style="margin-top:14px;">Assinatura renovada</h1>
    <p>Olá, <strong style="color:#F0F0F0;">${nome}</strong>. Sua assinatura Pro foi renovada com sucesso.</p>
    <p>Próxima cobrança: <strong style="color:#F0F0F0;">${dataRenovacao}</strong>.</p>
    <p>Para visualizar suas faturas acesse <strong style="color:#4D7C5F;">Configurações → Assinatura</strong>.</p>
  `);

  await resend.emails.send({
    from: getRemetente(),
    to: para,
    subject: "Assinatura renovada — Lava Jato Gestão",
    html,
  });
}
