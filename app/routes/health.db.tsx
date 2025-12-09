import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { db } from "~/db/turso.server";

/**
 * Health check de conexão com o banco (Turso).
 * Rota: /health.db
 */
export async function loader(_args: LoaderFunctionArgs) {
  try {
    const result = await db.execute("select 1 as ok");
    const ok = result.rows?.[0]?.ok === 1;
    return json(
      { ok, db: ok ? "connected" : "unknown" },
      { status: ok ? 200 : 500 }
    );
  } catch (error: any) {
    return json(
      {
        ok: false,
        error: "db-connection-failed",
        message: error?.message ?? "unknown error",
      },
      { status: 500 }
    );
  }
}

export default function HealthDb() {
  return null;
}

