import dotenv from "dotenv";
import { resolve } from "path";
import { db } from "./turso.server";

dotenv.config({ path: resolve(process.cwd(), ".env") });

async function main() {
  console.log("🔄 Executando migration: email_verificado em usuarios...");
  try {
    try {
      await db.execute({
        sql: "SELECT email_verificado FROM usuarios LIMIT 1",
        args: [],
      });
      console.log("ℹ️  Coluna email_verificado já existe!");
    } catch (checkError: unknown) {
      const err = checkError as { message?: string };
      const msg = (err?.message || "").toLowerCase();
      if (msg.includes("no such column") || msg.includes("no column named")) {
        console.log("📝 Adicionando coluna email_verificado...");
        await db.execute({
          sql: "ALTER TABLE usuarios ADD COLUMN email_verificado INTEGER DEFAULT 0",
          args: [],
        });
        console.log("✅ Coluna email_verificado adicionada!");
      } else {
        throw checkError;
      }
    }

    console.log("✅ Migration concluída!");
    process.exit(0);
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("❌ Erro:", error);
    console.error("Detalhes:", err?.message);
    process.exit(1);
  }
}

main();
