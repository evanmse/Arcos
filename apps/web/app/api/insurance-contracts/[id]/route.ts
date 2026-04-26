import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";

const TENANT = "default";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const pool = getPool();
  await ensureSchema(pool);
  const body = (await req.json()) as Partial<{
    agent_id: string | null;
    product_name: string;
    carrier: string;
    status: string;
    coverage: Record<string, any>;
    exclusions: string[];
    premium_eur: number;
    liability_cap_eur: number;
    deductible_eur: number;
    effective_date: string | null;
    expiry_date: string | null;
    notes: string;
  }>;
  const set: string[] = [];
  const vals: any[] = [];
  let i = 1;
  for (const [k, v] of Object.entries(body)) {
    if (k === "coverage" || k === "exclusions") {
      set.push(`${k} = $${i}::jsonb`);
      vals.push(JSON.stringify(v ?? (k === "exclusions" ? [] : {})));
    } else {
      set.push(`${k} = $${i}`);
      vals.push(v);
    }
    i++;
  }
  if (!set.length) return NextResponse.json({ ok: true });
  set.push("updated_at = now()");
  vals.push(id, TENANT);
  await pool.query(
    `UPDATE insurance_contracts SET ${set.join(", ")}
     WHERE contract_id=$${i} AND tenant_id=$${i + 1}`,
    vals,
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const pool = getPool();
  await ensureSchema(pool);
  await pool.query(
    "DELETE FROM insurance_contracts WHERE contract_id=$1 AND tenant_id=$2",
    [id, TENANT],
  );
  return NextResponse.json({ ok: true });
}
