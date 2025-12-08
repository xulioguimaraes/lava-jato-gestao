import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { join } from "path";
import dotenv from "dotenv";

// Carrega variáveis de ambiente
dotenv.config();

const databaseUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!databaseUrl || !authToken) {
  throw new Error(
    "TURSO_DATABASE_URL e TURSO_AUTH_TOKEN devem estar configurados no .env"
  );
}

export const db = createClient({
  url: databaseUrl,
  authToken: authToken,
});

// Função auxiliar para executar SQL
export async function executeSQL(sql: string, args?: any[]) {
  return await db.execute({
    sql,
    args: args || [],
  });
}

// Função para inicializar o banco (executar schema)
export async function initDatabase() {
  try {
    const schemaPath = join(process.cwd(), "app", "db", "schema.sql");
    const schema = readFileSync(schemaPath, "utf-8");
    
    // Executa cada statement separadamente
    const statements = schema
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      const trimmed = statement.trim();
      if (trimmed.length > 0) {
        try {
          // Remove comentários e linhas vazias
          const cleanStatement = trimmed
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0 && !line.startsWith("--"))
            .join(" ");

          if (cleanStatement.length > 0) {
            await db.execute({
              sql: cleanStatement,
              args: [],
            });
          }
        } catch (error: any) {
          // Ignora erros de tabela já existente
          const errorMsg = error?.message?.toLowerCase() || "";
          if (!errorMsg.includes("already exists") && 
              !errorMsg.includes("duplicate") &&
              !errorMsg.includes("table") &&
              !errorMsg.includes("index")) {
            console.error(`Erro ao executar: ${trimmed.substring(0, 50)}...`);
            throw error;
          }
        }
      }
    }
    
    console.log("✅ Banco de dados inicializado com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao inicializar banco:", error);
    // Não lança erro para não quebrar se as tabelas já existem
  }
}

