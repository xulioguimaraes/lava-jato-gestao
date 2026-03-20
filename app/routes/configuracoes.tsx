import { json, redirect } from "@remix-run/node";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import { requererUsuario } from "~/utils/session.server";
import { atualizarNome, atualizarNomeNegocio } from "~/utils/auth.server";
import { Toast } from "~/components/Toast";
import { BottomNav } from "~/components/dashboard/BottomNav";
import { pageTitle } from "~/utils/meta";

export const meta: MetaFunction = () => [
  { title: pageTitle("Configurações") },
  { name: "description", content: "Configurações da conta - X Lava Jato" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const usuario = await requererUsuario(request);
  return json({ usuario });
}

export async function action({ request }: ActionFunctionArgs) {
  const usuario = await requererUsuario(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "atualizarNome") {
    const nome = (formData.get("nome") as string)?.trim();
    if (!nome || nome.length < 2) {
      return json(
        { erro: "O nome deve ter pelo menos 2 caracteres", erroPara: "nome" },
        { status: 400 }
      );
    }
    await atualizarNome(usuario.id, nome);
    return json({ sucesso: "Nome atualizado com sucesso!" });
  }

  if (intent === "atualizarNomeNegocio") {
    const nomeNegocio = (formData.get("nome_negocio") as string)?.trim() || "";
    if (!nomeNegocio || nomeNegocio.length < 2) {
      return json(
        {
          erro: "O nome do negócio deve ter pelo menos 2 caracteres",
          erroPara: "nomeNegocio",
        },
        { status: 400 }
      );
    }
    await atualizarNomeNegocio(usuario.id, nomeNegocio);
    return json({ sucesso: "Nome do negócio atualizado com sucesso!" });
  }

  return json({ erro: "Ação inválida" }, { status: 400 });
}

const inputStyle = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
};

export default function Configuracoes() {
  const { usuario } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isSubmitting = navigation.state === "submitting";
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    if (actionData?.sucesso) {
      setToastMessage(actionData.sucesso);
      setShowToast(true);
      const t = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(t);
    }
  }, [actionData?.sucesso]);

  useEffect(() => {
    const toast = searchParams.get("toast");
    if (toast === "senha") {
      setToastMessage("Senha alterada com sucesso!");
      setShowToast(true);
      const next = new URLSearchParams(searchParams);
      next.delete("toast");
      setSearchParams(next, { replace: true });
      const t = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(t);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-deep pb-24 md:pb-8">
      {showToast && toastMessage && (
        <Toast message={toastMessage} onClose={() => setShowToast(false)} />
      )}

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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>
        <div>
          <h1 className="font-display font-bold text-base tracking-tight">
            Configurações
          </h1>
          <p
            className="font-mono-app"
            style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)" }}
          >
            Gerencie sua conta
          </p>
        </div>
      </header>

      <main className="px-4 py-6 max-w-2xl mx-auto space-y-4">
        {/* Nome - editável */}
        <div
          className="bg-surface rounded-md p-5"
          style={{ border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <h2
            className="font-mono-app uppercase tracking-[0.12em] mb-4"
            style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.4)" }}
          >
            Nome
          </h2>
          <Form method="post" className="space-y-3">
            <input type="hidden" name="intent" value="atualizarNome" />
            {actionData?.erroPara === "nome" && actionData?.erro && (
              <div
                className="px-3 py-2 rounded font-mono-app text-sm"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "rgba(239,68,68,0.95)",
                }}
              >
                {actionData.erro}
              </div>
            )}
            <input
              type="text"
              name="nome"
              defaultValue={usuario.nome}
              required
              minLength={2}
              className="w-full px-3 py-2 rounded font-mono-app text-sm"
              style={inputStyle}
              placeholder="Seu nome"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded font-mono-app text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "#4D7C5F", color: "#0C0C0C" }}
            >
              {isSubmitting ? "Salvando..." : "Salvar nome"}
            </button>
          </Form>
        </div>

        {/* Nome do negócio - editável */}
        <div
          className="bg-surface rounded-md p-5"
          style={{ border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <h2
            className="font-mono-app uppercase tracking-[0.12em] mb-4"
            style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.4)" }}
          >
            Nome do negócio
          </h2>
          <Form method="post" className="space-y-3">
            <input type="hidden" name="intent" value="atualizarNomeNegocio" />
            {actionData?.erroPara === "nomeNegocio" && actionData?.erro && (
              <div
                className="px-3 py-2 rounded font-mono-app text-sm"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "rgba(239,68,68,0.95)",
                }}
              >
                {actionData.erro}
              </div>
            )}
            <input
              type="text"
              name="nome_negocio"
              defaultValue={usuario.nome_negocio || ""}
              required
              minLength={2}
              className="w-full px-3 py-2 rounded font-mono-app text-sm"
              style={inputStyle}
              placeholder="Ex: Lava Jato Central"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded font-mono-app text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "#4D7C5F", color: "#0C0C0C" }}
            >
              {isSubmitting ? "Salvando..." : "Salvar nome do negócio"}
            </button>
          </Form>
        </div>

        {/* Email - somente leitura */}
        <div
          className="bg-surface rounded-md p-5"
          style={{ border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <h2
            className="font-mono-app uppercase tracking-[0.12em] mb-2"
            style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.4)" }}
          >
            Email
          </h2>
          <p
            className="font-mono-app text-sm"
            style={{ color: "rgba(255,255,255,0.9)" }}
          >
            {usuario.email}
          </p>
          <p
            className="font-mono-app mt-1"
            style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}
          >
            O email não pode ser alterado.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`font-mono-app text-xs px-2 py-0.5 rounded ${
                usuario.email_verificado
                  ? "bg-green-900/30 text-green-400"
                  : "bg-amber-900/30 text-amber-400"
              }`}
            >
              {usuario.email_verificado ? "Verificado" : "Não verificado"}
            </span>
          </div>
        </div>

        {/* Redefinir senha */}
        <Link
          to="/configuracoes/senha"
          className="block bg-surface rounded-md p-5 hover-item"
          style={{ border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2
                className="font-mono-app uppercase tracking-[0.12em] mb-1"
                style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.4)" }}
              >
                Redefinir senha
              </h2>
              <p
                className="font-mono-app text-sm"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                Altere sua senha de acesso
              </p>
            </div>
            <svg
              className="w-4 h-4"
              style={{ color: "rgba(255,255,255,0.3)" }}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </Link>

        {/* Página pública */}
        <Link
          to={`/${usuario.slug || "publico"}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-surface rounded-md p-5 hover-item"
          style={{ border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2
                className="font-mono-app uppercase tracking-[0.12em] mb-1"
                style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.4)" }}
              >
                Página pública
              </h2>
              <p
                className="font-mono-app text-sm"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                Ver link para funcionários registrarem lavagens
              </p>
            </div>
            <svg
              className="w-4 h-4"
              style={{ color: "rgba(255,255,255,0.3)" }}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </Link>

        {/* Sair */}
        <Form method="post" action="/dashboard">
          <input type="hidden" name="intent" value="logout" />
          <button
            type="submit"
            className="w-full bg-surface rounded-md p-5 hover-item text-left"
            style={{
              border: "1px solid rgba(255,255,255,0.07)",
              color: "rgba(239,68,68,0.9)",
            }}
          >
            <span className="font-mono-app text-sm">Sair da conta</span>
          </button>
        </Form>
      </main>

      <BottomNav />
    </div>
  );
}
