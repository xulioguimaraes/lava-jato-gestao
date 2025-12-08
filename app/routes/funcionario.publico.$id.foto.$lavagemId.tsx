import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { db } from "~/db/turso.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const lavagemId = params.lavagemId;
  
  if (!lavagemId) {
    throw new Response("Lavagem não encontrada", { status: 404 });
  }

  const result = await db.execute({
    sql: "SELECT foto_url FROM lavagens WHERE id = ?",
    args: [lavagemId],
  });

  if (result.rows.length === 0) {
    throw new Response("Lavagem não encontrada", { status: 404 });
  }

  const fotoUrl = result.rows[0].foto_url as string | null;

  if (!fotoUrl) {
    throw new Response("Foto não encontrada", { status: 404 });
  }

  // Retornar a foto como JSON (será carregada via fetch no cliente)
  return json({ foto_url: fotoUrl });
}

