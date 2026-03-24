import dotenv from "dotenv";
import { resolve } from "path";
import { db } from "./turso.server";

dotenv.config({ path: resolve(process.cwd(), ".env") });

const columns = [
  {
    name: "stripe_customer_id",
    sql: "ALTER TABLE usuarios ADD COLUMN stripe_customer_id TEXT",
  },
  {
    name: "stripe_subscription_id",
    sql: "ALTER TABLE usuarios ADD COLUMN stripe_subscription_id TEXT",
  },
  {
    name: "subscription_status",
    sql: "ALTER TABLE usuarios ADD COLUMN subscription_status TEXT DEFAULT 'free'",
  },
  {
    name: "plan_type",
    sql: "ALTER TABLE usuarios ADD COLUMN plan_type TEXT DEFAULT 'free'",
  },
  {
    name: "billing_period_end",
    sql: "ALTER TABLE usuarios ADD COLUMN billing_period_end DATETIME",
  },
];

async function main() {
  console.log("🔄 Executando migration: campos de assinatura em usuarios...");
  try {
    for (const col of columns) {
      try {
        await db.execute({
          sql: `SELECT ${col.name} FROM usuarios LIMIT 1`,
          args: [],
        });
        console.log(`ℹ️  Coluna ${col.name} já existe!`);
      } catch (checkError: unknown) {
        const err = checkError as { message?: string };
        const msg = (err?.message || "").toLowerCase();
        if (msg.includes("no such column") || msg.includes("no column named")) {
          console.log(`📝 Adicionando coluna ${col.name}...`);
          await db.execute({ sql: col.sql, args: [] });
          console.log(`✅ Coluna ${col.name} adicionada!`);
        } else {
          throw checkError;
        }
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
