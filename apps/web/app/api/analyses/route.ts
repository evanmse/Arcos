import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

const TENANT = "default";

export async function GET() {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT a.analysis_id,
            a.agent_id,
            a.model,
            a.trust_score,
            a.grade,
            a.risk_class,
            a.insurance_eligible,
            a.premium_estimate,
            a.created_at,
            ag.name AS agent_name,
            ag.repo_url
       FROM agent_analyses a
       JOIN agent_registrations ag ON ag.agent_id = a.agent_id
      WHERE a.tenant_id = $1
      ORDER BY a.created_at DESC
      LIMIT 200`,
    [TENANT],
  );
  return NextResponse.json({ analyses: rows });
}
