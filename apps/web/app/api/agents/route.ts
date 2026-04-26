import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getPool } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";

const TENANT = "default";
export const dynamic = "force-dynamic";

export async function GET() {
  const pool = getPool();
  await ensureSchema(pool);
  const { rows } = await pool.query(
    `SELECT a.agent_id, a.name, a.repo_url, a.path, a.description, a.status, a.created_at,
            la.trust_score, la.grade, la.risk_class, la.insurance_eligible,
            la.created_at AS analyzed_at, la.model
     FROM agent_registrations a
     LEFT JOIN LATERAL (
       SELECT trust_score, grade, risk_class, insurance_eligible, created_at, model
       FROM agent_analyses
       WHERE agent_id = a.agent_id
       ORDER BY created_at DESC
       LIMIT 1
     ) la ON true
     WHERE a.tenant_id=$1
     ORDER BY a.created_at DESC`,
    [TENANT],
  );
  return NextResponse.json({ agents: rows });
}

export async function POST(req: Request) {
  const pool = getPool();
  await ensureSchema(pool);
  const body = (await req.json()) as {
    name: string;
    repo_url: string;
    path?: string;
    description?: string;
  };
  if (!body?.name || !body?.repo_url) {
    return NextResponse.json({ error: "name and repo_url required" }, { status: 400 });
  }
  const id = "agt-" + crypto.randomBytes(6).toString("hex");
  await pool.query(
    `INSERT INTO agent_registrations (agent_id, tenant_id, name, repo_url, path, description)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [id, TENANT, body.name, body.repo_url, body.path ?? null, body.description ?? null],
  );
  return NextResponse.json({ agent_id: id });
}
