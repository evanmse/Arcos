import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

const TENANT = "default";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT a.*, ag.name AS agent_name, ag.repo_url
       FROM agent_analyses a
       JOIN agent_registrations ag ON ag.agent_id = a.agent_id
      WHERE a.analysis_id = $1 AND a.tenant_id = $2`,
    [id, TENANT],
  );
  if (rows.length === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ analysis: rows[0] });
}
