import dotenv from "dotenv";
import { resolve } from "path";
import { readFileSync } from "fs";
import { join } from "path";

// Carrega variáveis de ambiente
dotenv.config({ path: resolve(process.cwd(), ".env") });

import { db } from "./turso.server";

async function main() {
  console.log("🔄 Executando migration: porcentagem_comissao...");
  try {
    // Verificar se a coluna já existe
    try {
      const checkResult = await db.execute({
        sql: "SELECT porcentagem_comissao FROM funcionarios LIMIT 1",
        args: [],
      });
      console.log("ℹ️  Coluna porcentagem_comissao já existe!");
      
      // Atualizar funcionários que não têm porcentagem definida
      await db.execute({
        sql: "UPDATE funcionarios SET porcentagem_comissao = 40 WHERE porcentagem_comissao IS NULL",
        args: [],
      });
      console.log("✅ Funcionários atualizados com porcentagem padrão (40%)");
      process.exit(0);
    } catch (checkError: any) {
      // Se a coluna não existe, vamos adicioná-la
      const errorMsg = checkError?.message?.toLowerCase() || "";
      if (errorMsg.includes("no such column")) {
        console.log("📝 Adicionando coluna porcentagem_comissao...");
        
        // Adicionar a coluna
        await db.execute({
          sql: "ALTER TABLE funcionarios ADD COLUMN porcentagem_comissao REAL DEFAULT 40",
          args: [],
        });
        console.log("✅ Coluna porcentagem_comissao adicionada!");
        
        // Atualizar funcionários existentes
        await db.execute({
          sql: "UPDATE funcionarios SET porcentagem_comissao = 40 WHERE porcentagem_comissao IS NULL",
          args: [],
        });
        console.log("✅ Funcionários atualizados com porcentagem padrão (40%)");
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

