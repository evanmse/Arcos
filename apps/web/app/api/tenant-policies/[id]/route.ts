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
    label: string;
    description: string | null;
    enabled: boolean;
    mandatory: boolean;
    risk_categories: string[];
    mapped_obligations: string[];
    assigned_agents: string[];
  }>;

  const set: string[] = [];
  const vals: any[] = [];
  let i = 1;
  for (const [k, v] of Object.entries(body)) {
    if (
      k === "risk_categories" ||
      k === "mapped_obligations" ||
      k === "assigned_agents"
    ) {
      set.push(`${k} = $${i}::jsonb`);
      vals.push(JSON.stringify(v ?? []));
    } else {
      set.push(`${k} = $${i}`);
      vals.push(v);
    }
    i++;
  }
  if (set.length === 0) {
    return NextResponse.json({ ok: true, no_changes: true });
  }
  set.push(`updated_at = now()`);
  vals.push(id, TENANT);
  await pool.query(
    `UPDATE tenant_policies SET ${set.join(", ")}
     WHERE policy_id=$${i} AND tenant_id=$${i + 1}`,
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
  await pool.query("DELETE FROM tenant_policies WHERE policy_id=$1 AND tenant_id=$2", [
    id,
    TENANT,
  ]);
  return NextResponse.json({ ok: true });
}
