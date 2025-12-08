import bcrypt from "bcryptjs";
import { db } from "~/db/turso.server";

export interface Usuario {
  id: string;
  email: string;
  nome: string;
}

export async function criarUsuario(
  email: string,
  senha: string,
  nome: string
): Promise<Usuario> {
  const senhaHash = await bcrypt.hash(senha, 10);
  const id = crypto.randomUUID();

  await db.execute({
    sql: "INSERT INTO usuarios (id, email, senha_hash, nome) VALUES (?, ?, ?, ?)",
    args: [id, email, senhaHash, nome],
  });

  return { id, email, nome };
}

export async function verificarLogin(
  email: string,
  senha: string
): Promise<Usuario | null> {
  const result = await db.execute({
    sql: "SELECT id, email, senha_hash, nome FROM usuarios WHERE email = ?",
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
  };
}

export async function buscarUsuarioPorId(id: string): Promise<Usuario | null> {
  const result = await db.execute({
    sql: "SELECT id, email, nome FROM usuarios WHERE id = ?",
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
  };
}

