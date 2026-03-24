import { db } from "~/db/turso.server";

export interface LimitesPlano {
  maxFuncionarios: number;
  maxLavagensPorMes: number;
}

export function getLimitesPlano(planType: string): LimitesPlano {
  if (planType === "pro" || planType === "active") {
    return { maxFuncionarios: Infinity, maxLavagensPorMes: Infinity };
  }
  return { maxFuncionarios: 1, maxLavagensPorMes: 20 };
}

export async function verificarLimiteFuncionarios(
  userId: string,
  planType: string
): Promise<{ permitido: boolean; atual: number; limite: number }> {
  const limites = getLimitesPlano(planType);
  if (limites.maxFuncionarios === Infinity) {
    return { permitido: true, atual: 0, limite: Infinity };
  }

  const result = await db.execute({
    sql: "SELECT COUNT(*) as total FROM funcionarios WHERE user_id = ? AND ativo = 1",
    args: [userId],
  });
  const atual = Number(result.rows[0].total);
  return {
    permitido: atual < limites.maxFuncionarios,
    atual,
    limite: limites.maxFuncionarios,
  };
}

export async function verificarLimiteLavagens(
  userId: string,
  planType: string
): Promise<{ permitido: boolean; atual: number; limite: number }> {
  const limites = getLimitesPlano(planType);
  if (limites.maxLavagensPorMes === Infinity) {
    return { permitido: true, atual: 0, limite: Infinity };
  }

  const now = new Date();
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const result = await db.execute({
    sql: "SELECT COUNT(*) as total FROM lavagens WHERE user_id = ? AND data_lavagem >= ?",
    args: [userId, inicioMes],
  });
  const atual = Number(result.rows[0].total);
  return {
    permitido: atual < limites.maxLavagensPorMes,
    atual,
    limite: limites.maxLavagensPorMes,
  };
}
