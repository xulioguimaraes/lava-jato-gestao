import { randomUUID } from "crypto";
import { db } from "~/db/turso.server";

async function ensureUserIdColumn() {
  try {
    const info = await db.execute({
      sql: `PRAGMA table_info(lavagens);`,
      args: [],
    });
    const hasUserId = info.rows.some((row: any) => row.name === "user_id");
    if (!hasUserId) {
      await db.execute({
        sql: `ALTER TABLE lavagens ADD COLUMN user_id TEXT;`,
        args: [],
      });
    }
  } catch {
    // Ignorar se já existir ou não for possível alterar no ambiente atual
  }
}

async function ensureUserIdColumnFuncionarios() {
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

export interface Lavagem {
  id: string;
  funcionario_id: string;
  descricao: string;
  preco: number;
  foto_url: string | null;
  tem_foto?: boolean;
  data_lavagem: string;
  created_at: string;
  forma_pagamento: string | null;
  user_id?: string | null;
}

export interface LavagemComFuncionario extends Lavagem {
  funcionario_nome: string;
}

// Obter início e fim da semana (segunda a sábado)
// offset: 0 = semana atual, 1 = semana anterior, 2 = 2 semanas atrás, etc.
function obterSemana(offset: number = 0) {
  const hoje = new Date();
  const dia = hoje.getDay(); // 0 = domingo, 1 = segunda, etc.

  // Ajustar para segunda-feira = início da semana
  const diff = dia === 0 ? -6 : 1 - dia; // Se domingo, volta 6 dias; senão, ajusta para segunda
  const segunda = new Date(hoje);
  segunda.setDate(hoje.getDate() + diff - offset * 7);
  segunda.setHours(0, 0, 0, 0);

  const sabado = new Date(segunda);
  sabado.setDate(segunda.getDate() + 5);
  sabado.setHours(23, 59, 59, 999);

  return { inicio: segunda, fim: sabado };
}

function obterSemanaAtual() {
  return obterSemana(0);
}

export async function listarLavagensSemana(
  offsetSemana: number = 0,
  userId?: string
): Promise<LavagemComFuncionario[]> {
  await ensureUserIdColumn();
  const { inicio, fim } = obterSemana(offsetSemana);

  const filtroUser = userId ? " AND (l.user_id = ? OR l.user_id IS NULL)" : "";
  const args: (string | number)[] = [
    inicio.toISOString().split("T")[0],
    fim.toISOString().split("T")[0],
  ];
  if (userId) args.push(userId);

  const result = await db.execute({
    sql: `
      SELECT 
        l.id,
        l.funcionario_id,
        l.descricao,
        l.preco,
        (CASE WHEN l.foto_url IS NOT NULL THEN 1 ELSE 0 END) as tem_foto,
        l.data_lavagem,
        l.created_at,
        l.forma_pagamento,
        l.user_id,
        f.nome as funcionario_nome
      FROM lavagens l
      INNER JOIN funcionarios f ON l.funcionario_id = f.id
      WHERE l.data_lavagem >= ? AND l.data_lavagem <= ?${filtroUser}
      ORDER BY l.data_lavagem DESC, l.created_at DESC
    `,
    args,
  });

  return result.rows.map((row) => ({
    id: row.id as string,
    funcionario_id: row.funcionario_id as string,
    descricao: row.descricao as string,
    preco: row.preco as number,
    foto_url: null,
    tem_foto: !!row.tem_foto,
    data_lavagem: row.data_lavagem as string,
    created_at: row.created_at as string,
    forma_pagamento: (row.forma_pagamento as string) || null,
    user_id: (row.user_id as string) || null,
    funcionario_nome: row.funcionario_nome as string,
  }));
}

export async function listarTodasLavagens(
  userId?: string
): Promise<LavagemComFuncionario[]> {
  await ensureUserIdColumn();
  const filtroUser = userId ? " WHERE (l.user_id = ? OR l.user_id IS NULL)" : "";
  const args = userId ? [userId] : [];
  const result = await db.execute({
    sql: `
      SELECT 
        l.id,
        l.funcionario_id,
        l.descricao,
        l.preco,
        (CASE WHEN l.foto_url IS NOT NULL THEN 1 ELSE 0 END) as tem_foto,
        l.data_lavagem,
        l.created_at,
        l.user_id,
        f.nome as funcionario_nome
      FROM lavagens l
      INNER JOIN funcionarios f ON l.funcionario_id = f.id
      ${filtroUser}
      ORDER BY l.data_lavagem DESC, l.created_at DESC
    `,
    args,
  });

  return result.rows.map((row) => ({
    id: row.id as string,
    funcionario_id: row.funcionario_id as string,
    descricao: row.descricao as string,
    preco: row.preco as number,
    foto_url: null,
    tem_foto: !!row.tem_foto,
    data_lavagem: row.data_lavagem as string,
    created_at: row.created_at as string,
    forma_pagamento: (row.forma_pagamento as string) || null,
    user_id: (row.user_id as string) || null,
    funcionario_nome: row.funcionario_nome as string,
  }));
}

export async function listarLavagensPorFuncionario(
  funcionarioId: string,
  offsetSemana: number = 0,
  incluirFotos: boolean = true,
  userId?: string
): Promise<Lavagem[]> {
  await ensureUserIdColumn();
  const { inicio, fim } = obterSemana(offsetSemana);

  const filtroUser = userId ? " AND (user_id = ? OR user_id IS NULL)" : "";
  const args: (string | number)[] = [
    funcionarioId,
    inicio.toISOString().split("T")[0],
    fim.toISOString().split("T")[0],
  ];
  if (userId) args.push(userId);

  const result = await db.execute({
    sql: `
      SELECT id, funcionario_id, descricao, preco, foto_url, data_lavagem, created_at, user_id
      FROM lavagens
      WHERE funcionario_id = ? AND data_lavagem >= ? AND data_lavagem <= ?${filtroUser}
      ORDER BY data_lavagem DESC, created_at DESC
    `,
    args,
  });

  return result.rows.map((row) => {
    const fotoUrl = (row.foto_url as string) || null;
    // Se não deve incluir fotos, retornar apenas um indicador
    // Para reduzir o tamanho da resposta (fotos em base64 são muito grandes)
    return {
      id: row.id as string,
      funcionario_id: row.funcionario_id as string,
      descricao: row.descricao as string,
      preco: row.preco as number,
      foto_url: incluirFotos ? fotoUrl : fotoUrl ? "placeholder" : null,
      tem_foto: !!fotoUrl,
      data_lavagem: row.data_lavagem as string,
      created_at: row.created_at as string,
      forma_pagamento: (row.forma_pagamento as string) || null,
      user_id: (row.user_id as string) || null,
    };
  });
}

export async function criarLavagem(
  funcionarioId: string,
  descricao: string,
  preco: number,
  fotoUrl: string | null,
  dataLavagem: string,
  formaPagamento: string | null,
  userId?: string
): Promise<Lavagem> {
  await ensureUserIdColumn();
  const id = randomUUID();

  await db.execute({
    sql: `
      INSERT INTO lavagens (id, funcionario_id, descricao, preco, foto_url, data_lavagem, forma_pagamento, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      id,
      funcionarioId,
      descricao,
      preco,
      fotoUrl,
      dataLavagem,
      formaPagamento,
      userId || null,
    ],
  });

  const result = await db.execute({
    sql: "SELECT * FROM lavagens WHERE id = ?",
    args: [id],
  });

  const row = result.rows[0];
  return {
    id: row.id as string,
    funcionario_id: row.funcionario_id as string,
    descricao: row.descricao as string,
    preco: row.preco as number,
    foto_url: (row.foto_url as string) || null,
    data_lavagem: row.data_lavagem as string,
    created_at: row.created_at as string,
    forma_pagamento: (row.forma_pagamento as string) || null,
    user_id: (row.user_id as string) || null,
  };
}

export async function calcularTotalSemana(
  offsetSemana: number = 0,
  userId?: string
): Promise<{
  total: number;
  porFuncionario: {
    funcionario_id: string;
    funcionario_nome: string;
    total: number;
  }[];
}> {
  await ensureUserIdColumn();
  await ensureUserIdColumnFuncionarios();
  const { inicio, fim } = obterSemana(offsetSemana);

  const args = [
    inicio.toISOString().split("T")[0],
    fim.toISOString().split("T")[0],
  ];
  const userIdArgs = userId ? [userId, userId] : [null, null];

  const result = await db.execute({
    sql: `
      SELECT 
        f.id as funcionario_id,
        f.nome as funcionario_nome,
        COALESCE(SUM(l.preco), 0) as total
      FROM funcionarios f
      LEFT JOIN lavagens l ON f.id = l.funcionario_id 
        AND l.data_lavagem >= ? 
        AND l.data_lavagem <= ?
        AND (l.user_id = ? OR l.user_id IS NULL)
      WHERE f.ativo = 1
        AND (f.user_id = ? OR f.user_id IS NULL)
      GROUP BY f.id, f.nome
      ORDER BY total DESC
    `,
    args: [...args, ...userIdArgs],
  });

  const porFuncionario = result.rows.map((row) => ({
    funcionario_id: row.funcionario_id as string,
    funcionario_nome: row.funcionario_nome as string,
    total: (row.total as number) || 0,
  }));

  const total = porFuncionario.reduce((sum, f) => sum + f.total, 0);

  return { total, porFuncionario };
}

export async function calcularComissaoFuncionario(
  funcionarioId: string,
  offsetSemana: number = 0,
  userId?: string
): Promise<{ total: number; comissao: number; porcentagem: number }> {
  const lavagens = await listarLavagensPorFuncionario(
    funcionarioId,
    offsetSemana,
    true,
    userId
  );
  const total = lavagens.reduce((sum, l) => sum + l.preco, 0);

  // Buscar a porcentagem de comissão do funcionário
  const funcionarioResult = await db.execute({
    sql: "SELECT porcentagem_comissao FROM funcionarios WHERE id = ?",
    args: [funcionarioId],
  });

  const porcentagem =
    funcionarioResult.rows.length > 0
      ? Number(funcionarioResult.rows[0].porcentagem_comissao || 40)
      : 40;

  const comissao = total * (porcentagem / 100);

  return { total, comissao, porcentagem };
}

// Função auxiliar para obter informações da semana (para exibição)
export function obterInfoSemana(offset: number = 0) {
  const { inicio, fim } = obterSemana(offset);
  return {
    inicio,
    fim,
    inicioFormatado: inicio.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    }),
    fimFormatado: fim.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    }),
  };
}

export async function buscarLavagemPorId(id: string): Promise<Lavagem | null> {
  const result = await db.execute({
    sql: "SELECT * FROM lavagens WHERE id = ?",
    args: [id],
  });

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id as string,
    funcionario_id: row.funcionario_id as string,
    descricao: row.descricao as string,
    preco: row.preco as number,
    foto_url: (row.foto_url as string) || null,
    data_lavagem: row.data_lavagem as string,
    created_at: row.created_at as string,
    forma_pagamento: (row.forma_pagamento as string) || null,
  };
}

export async function atualizarLavagem(
  id: string,
  descricao: string,
  preco: number,
  fotoUrl: string | null,
  dataLavagem: string
): Promise<Lavagem> {
  await db.execute({
    sql: `
      UPDATE lavagens 
      SET descricao = ?, preco = ?, foto_url = ?, data_lavagem = ?
      WHERE id = ?
    `,
    args: [descricao, preco, fotoUrl, dataLavagem, id],
  });

  const lavagem = await buscarLavagemPorId(id);
  if (!lavagem) {
    throw new Error("Lavagem não encontrada");
  }

  return lavagem;
}

export async function excluirLavagem(id: string): Promise<void> {
  await db.execute({
    sql: "DELETE FROM lavagens WHERE id = ?",
    args: [id],
  });
}
