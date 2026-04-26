import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getPool } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import { POLICY_TEMPLATES } from "@/lib/policy-templates";

const TENANT = "default";
export const dynamic = "force-dynamic";

export async function GET() {
  const pool = getPool();
  await ensureSchema(pool);
  // Mark templates already adopted
  const { rows } = await pool.query(
    "SELECT template_id FROM tenant_policies WHERE tenant_id=$1 AND template_id IS NOT NULL",
    [TENANT],
  );
  const adopted = new Set(rows.map((r) => r.template_id));
  return NextResponse.json({
    templates: POLICY_TEMPLATES.map((t) => ({ ...t, adopted: adopted.has(t.template_id) })),
  });
}

export async function POST(req: Request) {
  const body = (await req.json()) as { template_ids: string[] };
  if (!Array.isArray(body.template_ids) || body.template_ids.length === 0) {
    return NextResponse.json({ error: "template_ids required" }, { status: 400 });
  }
  const pool = getPool();
  await ensureSchema(pool);
  const created: string[] = [];
  for (const tid of body.template_ids) {
    const t = POLICY_TEMPLATES.find((x) => x.template_id === tid);
    if (!t) continue;
    // Skip if already adopted
    const exists = await pool.query(
      "SELECT 1 FROM tenant_policies WHERE tenant_id=$1 AND template_id=$2",
      [TENANT, tid],
    );
    if ((exists.rowCount ?? 0) > 0) continue;
    const id = "pol-" + crypto.randomBytes(6).toString("hex");
    await pool.query(
      `INSERT INTO tenant_policies
         (policy_id, tenant_id, label, description, enabled, mandatory,
          risk_categories, mapped_obligations, assigned_agents, weight, template_id)
       VALUES ($1,$2,$3,$4,true,$5,$6::jsonb,'[]'::jsonb,'[]'::jsonb,$7,$8)`,
      [
        id,
        TENANT,
        t.label,
        t.description + ` (Source: ${t.source})`,
        t.mandatory,
        JSON.stringify(t.risk_categories),
        t.weight,
        t.template_id,
      ],
    );
    created.push(id);
  }
  return NextResponse.json({ created });
}
