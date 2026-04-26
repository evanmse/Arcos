import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getPool } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import { generateText } from "@/lib/vertex";

export const runtime = "nodejs";
export const maxDuration = 120;
export const dynamic = "force-dynamic";

const TENANT = "default";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { agent_id?: string };
  if (!body.agent_id) {
    return NextResponse.json({ error: "agent_id required" }, { status: 400 });
  }
  const pool = getPool();
  await ensureSchema(pool);

  const ag = await pool.query(
    "SELECT * FROM agent_registrations WHERE agent_id=$1 AND tenant_id=$2",
    [body.agent_id, TENANT],
  );
  if (ag.rowCount === 0) {
    return NextResponse.json({ error: "agent not found" }, { status: 404 });
  }
  const an = await pool.query(
    `SELECT * FROM agent_analyses WHERE agent_id=$1 ORDER BY created_at DESC LIMIT 1`,
    [body.agent_id],
  );
  if (an.rowCount === 0) {
    return NextResponse.json(
      { error: "agent has no analysis yet — analyze it first" },
      { status: 400 },
    );
  }
  const agent = ag.rows[0];
  const analysis = an.rows[0];

  const prompt = `You are an AI-liability underwriter. Given an analyzed AI agent, propose a binding insurance contract.

# AGENT
${agent.name} — ${agent.description ?? ""}
Repo: ${agent.repo_url}

# LATEST ANALYSIS
trust_score: ${analysis.trust_score}
grade: ${analysis.grade}
risk_class: ${analysis.risk_class}
insurance_eligible: ${analysis.insurance_eligible}
suggested premium hint: €${analysis.premium_estimate}/year

# YOUR TASK
Output a strict JSON object (no markdown fences) matching:
{
  "product_name": string,         // e.g. "Atlas Underwriter — AI Liability Cover"
  "carrier": string,              // pick one of: Munich Re, Hiscox, AXA XL, Allianz Trade, Lloyd's
  "status": "quoted",
  "coverage": {                   // structured coverages (free-form keys allowed)
    "ai_liability_eur": number,
    "data_breach_eur": number,
    "regulatory_fines_eur": number,
    "third_party_bodily_injury_eur": number,
    "errors_and_omissions_eur": number
  },
  "exclusions": string[],
  "premium_eur": number,          // annual premium €
  "liability_cap_eur": number,    // annual aggregate cap €
  "deductible_eur": number,       // per-claim deductible €
  "effective_date": "YYYY-MM-DD", // ~today
  "expiry_date": "YYYY-MM-DD",    // +12 months
  "notes": string                 // 2-3 sentence underwriting rationale
}
Calibrate cap and exclusions based on risk_class:
  - minimal/limited: cap €1-3M, low premium, few exclusions
  - high: cap €5-15M, premium €50-200k, exclude reckless misuse, lack of human oversight, training-data IP claims
  - unacceptable: status="declined", premium 0, cap 0, explanation in notes.
Respond with ONLY the JSON object.`;

  let parsed: any;
  try {
    const raw = await generateText(prompt, { jsonMode: true });
    const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    parsed = JSON.parse(cleaned);
  } catch (e: any) {
    return NextResponse.json(
      { error: "llm_failure", details: String(e?.message || e) },
      { status: 502 },
    );
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
      body.agent_id,
      parsed.product_name ?? `${agent.name} — AI Cover`,
      parsed.carrier ?? "Munich Re",
      parsed.status ?? "quoted",
      JSON.stringify(parsed.coverage ?? {}),
      JSON.stringify(parsed.exclusions ?? []),
      Number(parsed.premium_eur ?? analysis.premium_estimate ?? 0),
      Number(parsed.liability_cap_eur ?? 1000000),
      Number(parsed.deductible_eur ?? 5000),
      parsed.effective_date ?? null,
      parsed.expiry_date ?? null,
      parsed.notes ?? null,
    ],
  );

  return NextResponse.json({ contract_id: id, ...parsed });
}
