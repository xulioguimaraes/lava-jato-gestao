import dotenv from "dotenv";
import { resolve } from "path";
import { db } from "./turso.server";

// Carrega variáveis de ambiente
dotenv.config({ path: resolve(process.cwd(), ".env") });

async function main() {
  console.log("🔄 Executando migration: nome_negocio em usuarios...");
  try {
    // Verificar se a coluna já existe
    try {
      await db.execute({ sql: "SELECT nome_negocio FROM usuarios LIMIT 1", args: [] });
      console.log("ℹ️  Coluna nome_negocio já existe!");
    } catch (checkError: any) {
      const msg = (checkError?.message || "").toLowerCase();
      if (msg.includes("no such column") || msg.includes("no column named")) {
        console.log("📝 Adicionando coluna nome_negocio...");
        await db.execute({
          sql: "ALTER TABLE usuarios ADD COLUMN nome_negocio TEXT",
          args: [],
        });
        console.log("✅ Coluna nome_negocio adicionada!");
      } else {
        throw checkError;
      }
    }

    console.log("✅ Migration concluída!");
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Erro:", error);
    console.error("Detalhes:", error?.message);
    process.exit(1);
  }
}

main();


