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
    `SELECT a.analysis_id,
            a.agent_id,
            a.model,
            a.trust_score,
            a.grade,
            a.risk_class,
            a.insurance_eligible,
            a.premium_estimate,
            a.findings,
            a.matched_obligations,
            a.matched_policies,
            a.report_md,
            a.risk_matrix,
            a.created_at,
            ag.name AS agent_name
       FROM agent_analyses a
       JOIN agent_registrations ag ON ag.agent_id = a.agent_id
      WHERE a.agent_id = $1 AND a.tenant_id = $2
      ORDER BY a.created_at DESC`,
    [id, TENANT],
  );
  return NextResponse.json({ analyses: rows });
}
