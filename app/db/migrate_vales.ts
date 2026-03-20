import dotenv from "dotenv";
import { resolve } from "path";
import { db } from "./turso.server";

dotenv.config({ path: resolve(process.cwd(), ".env") });

async function main() {
  console.log("🔄 Executando migration: vales...");
  try {
    const tableCheck = await db.execute({
      sql: `SELECT name FROM sqlite_master WHERE type='table' AND name='vales'`,
      args: [],
    });

    if (tableCheck.rows.length > 0) {
      console.log("ℹ️  Tabela vales já existe!");
    } else {
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
      await db.execute({
        sql: `CREATE INDEX IF NOT EXISTS idx_vales_user ON vales(user_id)`,
        args: [],
      });
      console.log("✅ Tabela vales criada com índices!");
    }

    console.log("✅ Migration vales concluída!");
    process.exit(0);
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("❌ Erro:", error);
    console.error("Detalhes:", err?.message);
    process.exit(1);
  }
}

main();
