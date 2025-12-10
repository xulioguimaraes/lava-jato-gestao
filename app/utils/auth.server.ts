import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { db } from "~/db/turso.server";

export interface Usuario {
  id: string;
  email: string;
  nome: string;
  nome_negocio?: string | null;
  slug?: string | null;
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
    sql: "SELECT id, email, senha_hash, nome, slug, nome_negocio FROM usuarios WHERE email = ?",
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
  };
}

export async function buscarUsuarioPorId(id: string): Promise<Usuario | null> {
  const result = await db.execute({
    sql: "SELECT id, email, nome, slug, nome_negocio FROM usuarios WHERE id = ?",
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
  };
}

export async function buscarUsuarioPorSlug(slug: string): Promise<Usuario | null> {
  const result = await db.execute({
    sql: "SELECT id, email, nome, slug, nome_negocio FROM usuarios WHERE slug = ?",
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
  };
}

