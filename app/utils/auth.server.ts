import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { db } from "~/db/turso.server";

export interface Usuario {
  id: string;
  email: string;
  nome: string;
  nome_negocio?: string | null;
  slug?: string | null;
  email_verificado?: number;
}

export async function criarUsuario(
  email: string,
  senha: string,
  nome: string,
  slug: string,
  nomeNegocio: string
): Promise<Usuario> {
  const senhaHash = await bcrypt.hash(senha, 10);
  const id = randomUUID();

  await db.execute({
    sql: "INSERT INTO usuarios (id, email, senha_hash, nome, slug, nome_negocio) VALUES (?, ?, ?, ?, ?, ?)",
    args: [id, email, senhaHash, nome, slug, nomeNegocio],
  });

  return { id, email, nome, slug, nome_negocio: nomeNegocio };
}

export async function verificarLogin(
  email: string,
  senha: string
): Promise<Usuario | null> {
  const result = await db.execute({
    sql: "SELECT id, email, senha_hash, nome, slug, nome_negocio, COALESCE(email_verificado, 0) as email_verificado FROM usuarios WHERE email = ?",
    args: [email],
  });

  if (result.rows.length === 0) {
    return null;
  }

  const usuario = result.rows[0];
  const senhaHash = usuario.senha_hash as string;

  const senhaValida = await bcrypt.compare(senha, senhaHash);

  if (!senhaValida) {
    return null;
  }

  return {
    id: usuario.id as string,
    email: usuario.email as string,
    nome: usuario.nome as string,
    nome_negocio: (usuario.nome_negocio as string) || null,
    slug: (usuario.slug as string) || null,
    email_verificado: (usuario.email_verificado as number) ?? 0,
  };
}

export async function buscarUsuarioPorId(id: string): Promise<Usuario | null> {
  const result = await db.execute({
    sql: "SELECT id, email, nome, slug, nome_negocio, COALESCE(email_verificado, 0) as email_verificado FROM usuarios WHERE id = ?",
    args: [id],
  });

  if (result.rows.length === 0) {
    return null;
  }

  const usuario = result.rows[0];
  return {
    id: usuario.id as string,
    email: usuario.email as string,
    nome: usuario.nome as string,
    nome_negocio: (usuario.nome_negocio as string) || null,
    slug: (usuario.slug as string) || null,
    email_verificado: (usuario.email_verificado as number) ?? 0,
  };
}

export async function buscarUsuarioPorSlug(slug: string): Promise<Usuario | null> {
  const result = await db.execute({
    sql: "SELECT id, email, nome, slug, nome_negocio, COALESCE(email_verificado, 0) as email_verificado FROM usuarios WHERE slug = ?",
    args: [slug],
  });

  if (result.rows.length === 0) {
    return null;
  }

  const usuario = result.rows[0];
  return {
    id: usuario.id as string,
    email: usuario.email as string,
    nome: usuario.nome as string,
    nome_negocio: (usuario.nome_negocio as string) || null,
    slug: (usuario.slug as string) || null,
    email_verificado: (usuario.email_verificado as number) ?? 0,
  };
}

export async function atualizarNome(usuarioId: string, novoNome: string): Promise<void> {
  await db.execute({
    sql: "UPDATE usuarios SET nome = ? WHERE id = ?",
    args: [novoNome.trim(), usuarioId],
  });
}

export async function atualizarNomeNegocio(
  usuarioId: string,
  novoNomeNegocio: string
): Promise<void> {
  await db.execute({
    sql: "UPDATE usuarios SET nome_negocio = ? WHERE id = ?",
    args: [novoNomeNegocio.trim(), usuarioId],
  });
}

export async function redefinirSenha(
  usuarioId: string,
  senhaAtual: string,
  senhaNova: string
): Promise<{ ok: boolean; erro?: string }> {
  const result = await db.execute({
    sql: "SELECT senha_hash FROM usuarios WHERE id = ?",
    args: [usuarioId],
  });

  if (result.rows.length === 0) {
    return { ok: false, erro: "Usuário não encontrado" };
  }

  const senhaHashAtual = result.rows[0].senha_hash as string;
  const senhaValida = await bcrypt.compare(senhaAtual, senhaHashAtual);

  if (!senhaValida) {
    return { ok: false, erro: "Senha atual incorreta" };
  }

  if (senhaNova.length < 6) {
    return { ok: false, erro: "A nova senha deve ter pelo menos 6 caracteres" };
  }

  const senhaHashNova = await bcrypt.hash(senhaNova, 10);
  await db.execute({
    sql: "UPDATE usuarios SET senha_hash = ? WHERE id = ?",
    args: [senhaHashNova, usuarioId],
  });

  return { ok: true };
}

