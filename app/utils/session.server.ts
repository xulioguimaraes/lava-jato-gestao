import { createCookieSessionStorage, redirect } from "@remix-run/node";
import { buscarUsuarioPorId, type Usuario } from "./auth.server";

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET deve estar configurado");
}

const storage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30, // 30 dias
    path: "/",
    sameSite: "lax",
    secrets: [sessionSecret],
    secure: process.env.NODE_ENV === "production",
  },
});

export async function criarSessaoUsuario(usuarioId: string, redirectTo: string) {
  const session = await storage.getSession();
  session.set("usuarioId", usuarioId);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await storage.commitSession(session),
    },
  });
}

export async function obterSessao(request: Request) {
  return storage.getSession(request.headers.get("Cookie"));
}

export async function obterUsuario(request: Request): Promise<Usuario | null> {
  const session = await obterSessao(request);
  const usuarioId = session.get("usuarioId");

  if (!usuarioId || typeof usuarioId !== "string") {
    return null;
  }

  return buscarUsuarioPorId(usuarioId);
}

export async function requererUsuario(
  request: Request
): Promise<Usuario> {
  const usuario = await obterUsuario(request);

  if (!usuario) {
    throw redirect("/login");
  }

  return usuario;
}

export async function fazerLogout(request: Request) {
  const session = await obterSessao(request);
  return redirect("/login", {
    headers: {
      "Set-Cookie": await storage.destroySession(session),
    },
  });
}

