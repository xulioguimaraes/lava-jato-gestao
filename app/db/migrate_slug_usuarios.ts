import dotenv from "dotenv";
import { resolve } from "path";
import { db } from "./turso.server";

// Carrega variáveis de ambiente
dotenv.config({ path: resolve(process.cwd(), ".env") });

async function main() {
  console.log("🔄 Executando migration: slug em usuarios...");
  try {
    // 1) Verificar/adicionar coluna slug
    let colunaExiste = false;
    try {
      await db.execute({ sql: "SELECT slug FROM usuarios LIMIT 1", args: [] });
      colunaExiste = true;
      console.log("ℹ️  Coluna slug já existe, continuando...");
    } catch (checkError: any) {
      const msg = (checkError?.message || "").toLowerCase();
      if (msg.includes("no such column") || msg.includes("no column named")) {
        console.log("📝 Adicionando coluna slug...");
        await db.execute({
          sql: "ALTER TABLE usuarios ADD COLUMN slug TEXT",
          args: [],
        });
        colunaExiste = true;
        console.log("✅ Coluna slug adicionada!");
      } else {
        throw checkError;
      }
    }

    if (!colunaExiste) {
      throw new Error("Não foi possível garantir a coluna slug.");
    }

    // 2) Popular slugs ausentes garantindo unicidade
    const slugify = (input: string) =>
      (input || "meu-negocio")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .replace(/-{2,}/g, "-") || "meu-negocio";

    const usuarios = await db.execute({
      sql: "SELECT id, nome, slug FROM usuarios",
      args: [],
    });

    const existentes = new Set<string>();
    for (const row of usuarios.rows) {
      const s = (row.slug as string) || "";
      if (s) existentes.add(s.toLowerCase());
    }

    const gerarSlugUnicoLocal = (baseNome: string) => {
      const base = slugify(baseNome);
      if (!existentes.has(base)) {
        existentes.add(base);
        return base;
      }
      let i = 2;
      let candidato = `${base}-${i}`;
      while (existentes.has(candidato)) {
        i += 1;
        candidato = `${base}-${i}`;
      }
      existentes.add(candidato);
      return candidato;
    };

    for (const row of usuarios.rows) {
      const atual = (row.slug as string) || "";
      if (atual) continue;
      const nome = (row.nome as string) || "meu-negocio";
      const novoSlug = gerarSlugUnicoLocal(nome);
      await db.execute({
        sql: "UPDATE usuarios SET slug = ? WHERE id = ?",
        args: [novoSlug, row.id],
      });
    }

    // 3) Criar índice único
    await db.execute({
      sql: "CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_slug ON usuarios(slug)",
      args: [],
    });

    console.log("✅ Migration concluída!");
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Erro:", error);
    console.error("Detalhes:", error?.message);
    process.exit(1);
  }
}

main();


