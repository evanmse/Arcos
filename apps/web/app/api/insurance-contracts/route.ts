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
    `SELECT c.*, a.name AS agent_name, a.repo_url AS agent_repo
     FROM insurance_contracts c
     LEFT JOIN agent_registrations a ON a.agent_id = c.agent_id
     WHERE c.tenant_id=$1
     ORDER BY c.created_at DESC`,
    [TENANT],
  );
  return NextResponse.json({ contracts: rows });
}

export async function POST(req: Request) {
  const pool = getPool();
  await ensureSchema(pool);
  const body = (await req.json()) as {
    agent_id?: string | null;
    product_name: string;
    carrier?: string;
    status?: string;
    coverage?: Record<string, any>;
    exclusions?: string[];
    premium_eur?: number;
    liability_cap_eur?: number;
    deductible_eur?: number;
    effective_date?: string | null;
    expiry_date?: string | null;
    notes?: string;
  };
  if (!body.product_name) {
    return NextResponse.json({ error: "product_name required" }, { status: 400 });
  }
  const id = "ins-" + crypto.randomBytes(6).toString("hex");
  await pool.query(
    `INSERT INTO insurance_contracts
       (contract_id, tenant_id, agent_id, product_name, carrier, status,
        coverage, exclusions, premium_eur, liability_cap_eur, deductible_eur,
        effective_date, expiry_date, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10,$11,$12,$13,$14)`,
    [
      id,
      TENANT,
      body.agent_id ?? null,
      body.product_name,
      body.carrier ?? null,
      body.status ?? "quoted",
      JSON.stringify(body.coverage ?? {}),
      JSON.stringify(body.exclusions ?? []),
      body.premium_eur ?? 0,
      body.liability_cap_eur ?? 0,
      body.deductible_eur ?? 0,
      body.effective_date ?? null,
      body.expiry_date ?? null,
      body.notes ?? null,
    ],
  );
  return NextResponse.json({ contract_id: id });
}
