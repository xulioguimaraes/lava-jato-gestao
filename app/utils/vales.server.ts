import { randomUUID } from "crypto";
import { db } from "~/db/turso.server";

async function garantirTabelaVales() {
  try {
    const tableCheck = await db.execute({
      sql: `SELECT name FROM sqlite_master WHERE type='table' AND name='vales'`,
      args: [],
    });

    if (tableCheck.rows.length === 0) {
      await db.execute({
        sql: `
          CREATE TABLE vales (
            id TEXT PRIMARY KEY,
            funcionario_id TEXT NOT NULL,
            valor REAL NOT NULL,
            data_vale DATE NOT NULL,
            observacoes TEXT,
            user_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id)
          )
        `,
        args: [],
      });
      await db.execute({
        sql: `CREATE INDEX IF NOT EXISTS idx_vales_funcionario ON vales(funcionario_id)`,
        args: [],
      });
      await db.execute({
        sql: `CREATE INDEX IF NOT EXISTS idx_vales_data ON vales(data_vale)`,
        args: [],
      });
    }
  } catch (error) {
    console.error("Erro ao criar tabela vales:", error);
  }
}

export interface Vale {
  id: string;
  funcionario_id: string;
  valor: number;
  data_vale: string;
  observacoes: string | null;
  user_id?: string | null;
  created_at: string;
}

function obterSemana(offset: number = 0) {
  const hoje = new Date();
  const dia = hoje.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  const segunda = new Date(hoje);
  segunda.setDate(hoje.getDate() + diff - offset * 7);
  segunda.setHours(0, 0, 0, 0);
  const sabado = new Date(segunda);
  sabado.setDate(segunda.getDate() + 5);
  sabado.setHours(23, 59, 59, 999);
  return { inicio: segunda, fim: sabado };
}

export async function listarValesPorFuncionario(
  funcionarioId: string,
  offsetSemana: number = 0,
  userId?: string
): Promise<Vale[]> {
  await garantirTabelaVales();
  const { inicio, fim } = obterSemana(offsetSemana);

  const filtroUser = userId ? " AND (v.user_id = ? OR v.user_id IS NULL)" : "";
  const args: (string | number)[] = [
    funcionarioId,
    inicio.toISOString().split("T")[0],
    fim.toISOString().split("T")[0],
  ];
  if (userId) args.push(userId);

  const result = await db.execute({
    sql: `
      SELECT id, funcionario_id, valor, data_vale, observacoes, user_id, created_at
      FROM vales v
      WHERE funcionario_id = ? AND data_vale >= ? AND data_vale <= ?${filtroUser}
      ORDER BY data_vale DESC, created_at DESC
    `,
    args,
  });

  return result.rows.map((row) => ({
    id: row.id as string,
    funcionario_id: row.funcionario_id as string,
    valor: row.valor as number,
    data_vale: row.data_vale as string,
    observacoes: (row.observacoes as string) || null,
    user_id: (row.user_id as string) || null,
    created_at: row.created_at as string,
  }));
}

export async function calcularTotalValesFuncionario(
  funcionarioId: string,
  offsetSemana: number = 0,
  userId?: string
): Promise<number> {
  await garantirTabelaVales();
  const vales = await listarValesPorFuncionario(
    funcionarioId,
    offsetSemana,
    userId
  );
  return vales.reduce((sum, v) => sum + v.valor, 0);
}

/** Retorna total de vales por funcionário para múltiplos funcionários de uma vez */
export async function calcularValesPorFuncionariosSemana(
  funcionarioIds: string[],
  offsetSemana: number = 0,
  userId?: string
): Promise<Record<string, number>> {
  await garantirTabelaVales();
  if (funcionarioIds.length === 0) return {};

  const { inicio, fim } = obterSemana(offsetSemana);
  const filtroUser = userId ? " AND (v.user_id = ? OR v.user_id IS NULL)" : "";
  const placeholders = funcionarioIds.map(() => "?").join(",");
  const args: (string | number)[] = [
    ...funcionarioIds,
    inicio.toISOString().split("T")[0],
    fim.toISOString().split("T")[0],
  ];
  if (userId) args.push(userId);

  const result = await db.execute({
    sql: `
      SELECT funcionario_id, COALESCE(SUM(valor), 0) as total
      FROM vales v
      WHERE funcionario_id IN (${placeholders}) AND data_vale >= ? AND data_vale <= ?${filtroUser}
      GROUP BY funcionario_id
    `,
    args,
  });

  const mapa: Record<string, number> = {};
  funcionarioIds.forEach((id) => (mapa[id] = 0));
  result.rows.forEach((row) => {
    mapa[row.funcionario_id as string] = (row.total as number) || 0;
  });
  return mapa;
}

export async function criarVale(
  funcionarioId: string,
  valor: number,
  dataVale: string,
  observacoes: string | null,
  userId?: string
): Promise<Vale> {
  await garantirTabelaVales();
  const id = randomUUID();

  await db.execute({
    sql: `
      INSERT INTO vales (id, funcionario_id, valor, data_vale, observacoes, user_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    args: [id, funcionarioId, valor, dataVale, observacoes || null, userId || null],
  });

  const result = await db.execute({
    sql: "SELECT id, funcionario_id, valor, data_vale, observacoes, user_id, created_at FROM vales WHERE id = ?",
    args: [id],
  });

  const row = result.rows[0];
  return {
    id: row.id as string,
    funcionario_id: row.funcionario_id as string,
    valor: row.valor as number,
    data_vale: row.data_vale as string,
    observacoes: (row.observacoes as string) || null,
    user_id: (row.user_id as string) || null,
    created_at: row.created_at as string,
  };
}
