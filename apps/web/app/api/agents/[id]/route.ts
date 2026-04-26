import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";

const TENANT = "default";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const pool = getPool();
  await ensureSchema(pool);
  const a = await pool.query(
    "SELECT * FROM agent_registrations WHERE agent_id=$1 AND tenant_id=$2",
    [id, TENANT],
  );
  if (a.rowCount === 0) {
    return NextResponse.json({ error: "agent not found" }, { status: 404 });
  }
  const analyses = await pool.query(
    "SELECT * FROM agent_analyses WHERE agent_id=$1 ORDER BY created_at DESC LIMIT 5",
    [id],
  );
  return NextResponse.json({ agent: a.rows[0], analyses: analyses.rows });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const pool = getPool();
  await ensureSchema(pool);
  await pool.query("DELETE FROM agent_registrations WHERE agent_id=$1 AND tenant_id=$2", [
    id,
    TENANT,
  ]);
  return NextResponse.json({ ok: true });
}
