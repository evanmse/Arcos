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
    `SELECT policy_id, label, description, parent_id, enabled, mandatory,
            risk_categories, mapped_obligations, assigned_agents,
            created_at, updated_at
     FROM tenant_policies
     WHERE tenant_id=$1
     ORDER BY created_at DESC`,
    [TENANT],
  );
  return NextResponse.json({ policies: rows });
}

export async function POST(req: Request) {
  const pool = getPool();
  await ensureSchema(pool);
  const body = (await req.json()) as {
    label: string;
    description?: string;
    parent_id?: string | null;
    risk_categories?: string[];
    mapped_obligations?: string[];
    assigned_agents?: string[];
    mandatory?: boolean;
    enabled?: boolean;
  };
  if (!body?.label) {
    return NextResponse.json({ error: "label required" }, { status: 400 });
  }
  const id = "pol-" + crypto.randomBytes(6).toString("hex");
  await pool.query(
    `INSERT INTO tenant_policies
       (policy_id, tenant_id, label, description, parent_id, enabled, mandatory,
        risk_categories, mapped_obligations, assigned_agents)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10::jsonb)`,
    [
      id,
      TENANT,
      body.label,
      body.description ?? null,
      body.parent_id ?? null,
      body.enabled ?? true,
      body.mandatory ?? false,
      JSON.stringify(body.risk_categories ?? []),
      JSON.stringify(body.mapped_obligations ?? []),
      JSON.stringify(body.assigned_agents ?? []),
    ],
  );
  return NextResponse.json({ policy_id: id });
}
