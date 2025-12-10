import dotenv from "dotenv";
import { resolve } from "path";
import { db } from "./turso.server";

// Carrega variáveis de ambiente
dotenv.config({ path: resolve(process.cwd(), ".env") });

async function main() {
  console.log("🔄 Executando migration: forma_pagamento em lavagens...");
  try {
    // Verificar se a coluna já existe
    try {
      await db.execute({
        sql: "SELECT forma_pagamento FROM lavagens LIMIT 1",
        args: [],
      });
      console.log("ℹ️  Coluna forma_pagamento já existe!");
      process.exit(0);
    } catch (checkError: any) {
      const msg = (checkError?.message || "").toLowerCase();
      if (msg.includes("no such column") || msg.includes("no column named")) {
        console.log("📝 Adicionando coluna forma_pagamento...");
        await db.execute({
          sql: "ALTER TABLE lavagens ADD COLUMN forma_pagamento TEXT",
          args: [],
        });
        console.log("✅ Coluna forma_pagamento adicionada!");
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


