import { db } from "~/db/turso.server";
import { randomUUID } from "crypto";

async function ensureUserIdColumn() {
  try {
    const info = await db.execute({
      sql: `PRAGMA table_info(funcionarios);`,
      args: [],
    });
    const hasUserId = info.rows.some((row: any) => row.name === "user_id");
    if (!hasUserId) {
      await db.execute({
        sql: `ALTER TABLE funcionarios ADD COLUMN user_id TEXT;`,
        args: [],
      });
    }
  } catch {
    // Ignorar se já existir ou não for possível alterar no ambiente atual
  }
}

export interface Funcionario {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  ativo: number;
  porcentagem_comissao: number;
  user_id?: string | null;
  created_at: string;
}

export async function listarFuncionarios(
  userId?: string
): Promise<Funcionario[]> {
  await ensureUserIdColumn();
  try {
    const where = userId ? " WHERE (user_id = ? OR user_id IS NULL)" : "";
    const sql = `SELECT id, nome, email, telefone, ativo, porcentagem_comissao, user_id, created_at FROM funcionarios${where} ORDER BY nome`;
    const args = userId ? [userId] : [];
    const result = await db.execute({ sql, args });

    if (!result || !result.rows) {
      return [];
    }

    return result.rows.map((row: any) => ({
      id: String(row.id || ""),
      nome: String(row.nome || ""),
      email: row.email ? String(row.email) : null,
      telefone: row.telefone ? String(row.telefone) : null,
      ativo: Number(row.ativo || 1),
      porcentagem_comissao: Number(row.porcentagem_comissao || 40),
      user_id: row.user_id ? String(row.user_id) : null,
      created_at: String(row.created_at || ""),
    }));
  } catch (error) {
    console.error("Erro ao listar funcionários:", error);
    return [];
  }
}

export async function buscarFuncionarioPorId(id: string): Promise<Funcionario | null> {
  await ensureUserIdColumn();
  const result = await db.execute({
    sql: "SELECT id, nome, email, telefone, ativo, porcentagem_comissao, user_id, created_at FROM funcionarios WHERE id = ?",
    args: [id],
  });

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id as string,
    nome: row.nome as string,
    email: (row.email as string) || null,
    telefone: (row.telefone as string) || null,
    ativo: row.ativo as number,
    porcentagem_comissao: Number(row.porcentagem_comissao || 40),
  user_id: (row.user_id as string) || null,
    created_at: row.created_at as string,
  };
}

export async function criarFuncionario(
  nome: string,
  email?: string,
  telefone?: string,
  porcentagemComissao: number = 40,
  userId?: string
): Promise<Funcionario> {
  await ensureUserIdColumn();
  const id = randomUUID();

  try {
    // Tentativa com colunas porcentagem_comissao e user_id (schema atual)
    await db.execute({
      sql: "INSERT INTO funcionarios (id, nome, email, telefone, porcentagem_comissao, user_id) VALUES (?, ?, ?, ?, ?, ?)",
      args: [id, nome, email || null, telefone || null, porcentagemComissao, userId || null],
    });
  } catch (error: any) {
    const msg = (error?.message || "").toLowerCase();
    // Se a coluna ainda não existe no ambiente (ex.: produção sem migration), faz fallback
    if (
      msg.includes("porcentagem_comissao") ||
      msg.includes("user_id") ||
      msg.includes("no such column")
    ) {
  await db.execute({
    sql: "INSERT INTO funcionarios (id, nome, email, telefone) VALUES (?, ?, ?, ?)",
    args: [id, nome, email || null, telefone || null],
  });
    } else {
      throw error;
    }
  }

  return buscarFuncionarioPorId(id) as Promise<Funcionario>;
}

export async function atualizarFuncionario(
  id: string,
  nome: string,
  email?: string,
  telefone?: string,
  ativo?: boolean,
  porcentagemComissao?: number
): Promise<void> {
  // Se porcentagemComissao não foi fornecida, manter o valor atual
  if (porcentagemComissao !== undefined) {
    await db.execute({
      sql: "UPDATE funcionarios SET nome = ?, email = ?, telefone = ?, ativo = ?, porcentagem_comissao = ? WHERE id = ?",
      args: [nome, email || null, telefone || null, ativo ? 1 : 0, porcentagemComissao, id],
    });
  } else {
  await db.execute({
    sql: "UPDATE funcionarios SET nome = ?, email = ?, telefone = ?, ativo = ? WHERE id = ?",
    args: [nome, email || null, telefone || null, ativo ? 1 : 0, id],
  });
  }
}

export async function deletarFuncionario(id: string): Promise<void> {
  await db.execute({
    sql: "DELETE FROM funcionarios WHERE id = ?",
    args: [id],
  });
}

