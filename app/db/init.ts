import dotenv from "dotenv";
import { resolve } from "path";

// Carrega variáveis de ambiente do arquivo .env na raiz do projeto
dotenv.config({ path: resolve(process.cwd(), ".env") });

import { initDatabase } from "./turso.server";

async function main() {
  console.log("🔄 Inicializando banco de dados...");
  try {
    await initDatabase();
    console.log("✅ Concluído!");
    process.exit(0);
  } catch (error: any) {
    // Se as tabelas já existem, não é um erro crítico
    if (error?.message?.includes("already exists") || error?.message?.includes("duplicate")) {
      console.log("ℹ️  Tabelas já existem. Continuando...");
      process.exit(0);
    }
    throw error;
  }
}

main().catch((error) => {
  console.error("❌ Erro:", error);
  process.exit(1);
});

