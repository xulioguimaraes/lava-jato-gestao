import { db } from "~/db/turso.server";

// Função para garantir que a tabela de despesas existe
async function garantirTabelaDespesas() {
  try {
    // Verificar se a tabela existe
    const tableCheck = await db.execute({
      sql: `SELECT name FROM sqlite_master WHERE type='table' AND name='despesas'`,
      args: [],
    });

    if (tableCheck.rows.length === 0) {
      // Criar tabela nova com a estrutura correta
      await db.execute({
        sql: `
        CREATE TABLE despesas (
          id TEXT PRIMARY KEY,
          descricao TEXT NOT NULL,
          valor REAL NOT NULL,
          foto_url TEXT,
          data_despesa DATE NOT NULL,
          observacoes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        `,
        args: [],
      });
    } else {
      // Tabela existe, verificar e adicionar coluna foto_url se não existir
      try {
        await db.execute({
          sql: `ALTER TABLE despesas ADD COLUMN foto_url TEXT`,
          args: [],
        });
      } catch (error) {
        // Ignora se a coluna já existir
      }
    }

    await db.execute({
      sql: `CREATE INDEX IF NOT EXISTS idx_despesas_data ON despesas(data_despesa)`,
      args: [],
    });
  } catch (error) {
    // Ignora erros se a tabela já existir
    console.error("Erro ao criar tabela despesas:", error);
  }
}

export interface Despesa {
  id: string;
  descricao: string;
  valor: number;
  foto_url: string | null;
  data_despesa: string;
  observacoes: string | null;
  created_at: string;
}

// Obter início e fim da semana (segunda a sábado)
// offset: 0 = semana atual, 1 = semana anterior, 2 = 2 semanas atrás, etc.
function obterSemana(offset: number = 0) {
  const hoje = new Date();
  const dia = hoje.getDay(); // 0 = domingo, 1 = segunda, etc.
  
  // Ajustar para segunda-feira = início da semana
  const diff = dia === 0 ? -6 : 1 - dia; // Se domingo, volta 6 dias; senão, ajusta para segunda
  const segunda = new Date(hoje);
  segunda.setDate(hoje.getDate() + diff - (offset * 7));
  segunda.setHours(0, 0, 0, 0);
  
  const sabado = new Date(segunda);
  sabado.setDate(segunda.getDate() + 5);
  sabado.setHours(23, 59, 59, 999);
  
  return { inicio: segunda, fim: sabado };
}

function obterSemanaAtual() {
  return obterSemana(0);
}

export async function listarDespesasSemana(offsetSemana: number = 0): Promise<Despesa[]> {
  await garantirTabelaDespesas();
  const { inicio, fim } = obterSemana(offsetSemana);
  
  const result = await db.execute({
    sql: `
      SELECT id, descricao, valor, NULL as foto_url, data_despesa, observacoes, created_at
      FROM despesas
      WHERE data_despesa >= ? AND data_despesa <= ?
      ORDER BY data_despesa DESC, created_at DESC
    `,
    args: [
      inicio.toISOString().split("T")[0],
      fim.toISOString().split("T")[0],
    ],
  });

  return result.rows.map((row) => ({
    id: row.id as string,
    descricao: row.descricao as string,
    valor: row.valor as number,
    foto_url: null,
    data_despesa: row.data_despesa as string,
    observacoes: (row.observacoes as string) || null,
    created_at: row.created_at as string,
  }));
}

export async function listarTodasDespesas(): Promise<Despesa[]> {
  await garantirTabelaDespesas();
  const result = await db.execute({
    sql: `
      SELECT id, descricao, valor, foto_url, data_despesa, observacoes, created_at
      FROM despesas
      ORDER BY data_despesa DESC, created_at DESC
    `,
    args: [],
  });

  return result.rows.map((row) => ({
    id: row.id as string,
    descricao: row.descricao as string,
    valor: row.valor as number,
    foto_url: (row.foto_url as string) || null,
    data_despesa: row.data_despesa as string,
    observacoes: (row.observacoes as string) || null,
    created_at: row.created_at as string,
  }));
}

export async function calcularTotalDespesasSemana(offsetSemana: number = 0): Promise<number> {
  await garantirTabelaDespesas();
  const { inicio, fim } = obterSemana(offsetSemana);
  
  const result = await db.execute({
    sql: `
      SELECT COALESCE(SUM(valor), 0) as total
      FROM despesas
      WHERE data_despesa >= ? AND data_despesa <= ?
    `,
    args: [
      inicio.toISOString().split("T")[0],
      fim.toISOString().split("T")[0],
    ],
  });

  return (result.rows[0]?.total as number) || 0;
}

export async function criarDespesa(
  descricao: string,
  valor: number,
  dataDespesa: string,
  observacoes: string | null
): Promise<Despesa> {
  await garantirTabelaDespesas();
  const id = crypto.randomUUID();

  await db.execute({
    sql: `
      INSERT INTO despesas (id, descricao, valor, foto_url, data_despesa, observacoes)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    args: [id, descricao, valor, null, dataDespesa, observacoes],
  });

  const result = await db.execute({
    sql: "SELECT * FROM despesas WHERE id = ?",
    args: [id],
  });

  const row = result.rows[0];
    return {
    id: row.id as string,
    descricao: row.descricao as string,
    valor: row.valor as number,
    foto_url: (row.foto_url as string) || null,
    data_despesa: row.data_despesa as string,
    observacoes: (row.observacoes as string) || null,
    created_at: row.created_at as string,
  };
}

export async function buscarDespesaPorId(id: string): Promise<Despesa | null> {
  await garantirTabelaDespesas();
  const result = await db.execute({
    sql: "SELECT * FROM despesas WHERE id = ?",
    args: [id],
  });

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
    return {
    id: row.id as string,
    descricao: row.descricao as string,
    valor: row.valor as number,
    foto_url: (row.foto_url as string) || null,
    data_despesa: row.data_despesa as string,
    observacoes: (row.observacoes as string) || null,
    created_at: row.created_at as string,
  };
}

export async function atualizarDespesa(
  id: string,
  descricao: string,
  valor: number,
  dataDespesa: string,
  observacoes: string | null,
  fotoUrl: string
): Promise<Despesa> {
  await garantirTabelaDespesas();
  await db.execute({
    sql: `
      UPDATE despesas 
      SET descricao = ?, valor = ?, foto_url = ?, data_despesa = ?, observacoes = ?
      WHERE id = ?
    `,
    args: [descricao, valor, fotoUrl, dataDespesa, observacoes, id],
  });

  const despesa = await buscarDespesaPorId(id);
  if (!despesa) {
    throw new Error("Despesa não encontrada");
  }

  return despesa;
}

export async function excluirDespesa(id: string): Promise<void> {
  await garantirTabelaDespesas();
  await db.execute({
    sql: "DELETE FROM despesas WHERE id = ?",
    args: [id],
  });
}

