import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getPool } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import { embedTexts, generateText } from "@/lib/vertex";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const TENANT = "default";

type AgentMetadata = {
  name: string;
  description?: string;
  system_prompt?: string;
  model?: string;
  tools?: string[];
  risk_class?: string;
  domain?: string;
  raw?: string;
};

// github.com/owner/repo[/tree/main/path] -> raw URL builder
function parseGithub(repoUrl: string, path: string | null) {
  const m = repoUrl.match(
    /github\.com[/:]([^/]+)\/([^/.]+?)(?:\.git)?(?:\/tree\/([^/]+)(?:\/(.+))?)?\/?$/,
  );
  if (!m) return null;
  const [, owner, repo, branch = "main", subpath = ""] = m;
  const base = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/`;
  const inner = (path ?? subpath ?? "").replace(/^\/+|\/+$/g, "");
  return { owner, repo, branch, base, subpath: inner };
}

async function fetchAgentMetadata(repoUrl: string, path: string | null): Promise<AgentMetadata> {
  const parsed = parseGithub(repoUrl, path);
  if (!parsed) {
    return { name: "unknown", raw: "" };
  }
  const candidates = [
    `${parsed.subpath ? parsed.subpath + "/" : ""}agent.yaml`,
    `${parsed.subpath ? parsed.subpath + "/" : ""}agent.yml`,
    `${parsed.subpath ? parsed.subpath + "/" : ""}README.md`,
    `${parsed.subpath ? parsed.subpath + "/" : ""}prompts/system.md`,
  ];
  let raw = "";
  for (const c of candidates) {
    try {
      const r = await fetch(parsed.base + c);
      if (r.ok) {
        const t = await r.text();
        raw += `\n\n# === ${c} ===\n${t}`;
      }
    } catch {}
  }
  if (!raw) {
    return { name: "unknown", raw: "" };
  }
  // very-light yaml parser for top-level scalars
  const md: AgentMetadata = { name: "unknown", raw };
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^(name|description|model|risk_class|domain):\s*(.+?)\s*$/);
    if (m) (md as any)[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return md;
}

async function ragRetrieve(pool: any, queryText: string, k = 10) {
  const [vec] = await embedTexts([queryText]);
  const v = `[${vec.join(",")}]`;
  const { rows } = await pool.query(
    `SELECT obligation_id, regulation_id, statement, dimension, severity, risk_categories
     FROM risk_obligations
     WHERE statement_embedding IS NOT NULL
     ORDER BY statement_embedding <=> $1::vector
     LIMIT $2`,
    [v, k],
  );
  return rows;
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const pool = getPool();
  await ensureSchema(pool);

  const ag = await pool.query(
    "SELECT * FROM agent_registrations WHERE agent_id=$1 AND tenant_id=$2",
    [id, TENANT],
  );
  if (ag.rowCount === 0) {
    return NextResponse.json({ error: "agent not found" }, { status: 404 });
  }
  const agent = ag.rows[0];

  // Fetch agent metadata from GitHub
  const md = await fetchAgentMetadata(agent.repo_url, agent.path);

  // RAG: retrieve top obligations that match the agent description / system prompt
  const queryText =
    [agent.name, agent.description, md.description, md.raw?.slice(0, 4000)]
      .filter(Boolean)
      .join("\n\n") || agent.name;

  let matchedObligations: any[] = [];
  try {
    matchedObligations = await ragRetrieve(pool, queryText, 12);
  } catch (e) {
    matchedObligations = [];
  }

  // Pull policies for context
  const pol = await pool.query(
    `SELECT policy_id, label, description, risk_categories, mandatory, enabled
     FROM tenant_policies WHERE tenant_id=$1 AND enabled=true`,
    [TENANT],
  );
  const matchedPolicies = pol.rows.filter((p) =>
    (p.assigned_agents ? [] : []).length >= 0
      ? true // we'll just include all enabled for now and let LLM pick
      : false,
  );

  // Build the prompt
  const obligationsBlock = matchedObligations
    .slice(0, 12)
    .map(
      (o, i) =>
        `[${i + 1}] (${o.regulation_id} · ${o.dimension ?? "–"} · ${
          o.severity ?? "–"
        }) ${String(o.statement || "").slice(0, 380)}`,
    )
    .join("\n");

  const policiesBlock = pol.rows
    .map((p) => `- ${p.label}${p.mandatory ? " (mandatory)" : ""}: ${p.description ?? ""}`)
    .join("\n");

  const prompt = `You are an AI risk underwriter. Analyze this AI agent for regulatory compliance and insurability.

# AGENT
Name: ${agent.name}
Description: ${agent.description ?? md.description ?? "—"}
Model: ${md.model ?? "—"}
Risk class hint: ${md.risk_class ?? "—"}
Repo: ${agent.repo_url}

## Agent metadata (raw)
${(md.raw || "(no metadata file found in repo)").slice(0, 6000)}

# RELEVANT REGULATORY OBLIGATIONS (top-${matchedObligations.length} via vector RAG over EU AI Act, GDPR, DORA, MiCA)
${obligationsBlock || "(no obligations indexed yet)"}

# TENANT POLICIES (active)
${policiesBlock || "(none)"}

# YOUR TASK
Output a strict JSON object (no markdown fences). Schema:
{
  "trust_score": number (0..100),
  "grade": "A"|"B"|"C"|"D"|"E",
  "risk_class": "minimal"|"limited"|"high"|"unacceptable",
  "insurance_eligible": boolean,
  "premium_estimate_eur_per_year": number,
  "findings": [ { "severity":"high"|"medium"|"low", "title": string, "evidence": string, "recommendation": string } ],
  "matched_obligations": [ { "obligation_id": string, "regulation_id": string, "verdict":"covered"|"partial"|"uncovered", "rationale": string } ],
  "matched_policies": [ { "policy_id": string, "verdict":"covered"|"partial"|"uncovered" } ],
  "report_md": string  // a 400-700 word markdown executive report
}

Only respond with the JSON object.`;

  let parsed: any = null;
  let llmRaw = "";
  try {
    llmRaw = await generateText(prompt, { jsonMode: true });
    // Strip code fences if any
    const cleaned = llmRaw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    parsed = JSON.parse(cleaned);
  } catch (e: any) {
    return NextResponse.json(
      {
        error: "llm_failure",
        details: String(e?.message || e),
        llm_raw: llmRaw.slice(0, 2000),
      },
      { status: 502 },
    );
  }

  const analysisId = "an-" + crypto.randomBytes(6).toString("hex");
  await pool.query(
    `INSERT INTO agent_analyses
       (analysis_id, agent_id, tenant_id, model, trust_score, grade, risk_class,
        insurance_eligible, premium_estimate, findings, matched_obligations,
        matched_policies, report_md)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb,$12::jsonb,$13)`,
    [
      analysisId,
      id,
      TENANT,
      process.env.VERTEX_LLM_MODEL ?? "gemini-2.5-pro",
      Number(parsed.trust_score ?? 0),
      parsed.grade ?? "C",
      parsed.risk_class ?? "limited",
      Boolean(parsed.insurance_eligible),
      Number(parsed.premium_estimate_eur_per_year ?? 0),
      JSON.stringify(parsed.findings ?? []),
      JSON.stringify(parsed.matched_obligations ?? []),
      JSON.stringify(parsed.matched_policies ?? []),
      parsed.report_md ?? "",
    ],
  );

  await pool.query(
    `UPDATE agent_registrations SET status='analyzed', updated_at=now() WHERE agent_id=$1`,
    [id],
  );

  return NextResponse.json({ analysis_id: analysisId, ...parsed });
}
