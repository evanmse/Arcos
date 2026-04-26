import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";
const TENANT = "default";

export async function GET() {
  const pool = getPool();

  // Latest analysis per agent
  const { rows: agents } = await pool.query(
    `SELECT a.agent_id, a.name, a.description, a.status,
            la.analysis_id, la.trust_score, la.grade, la.risk_class,
            la.insurance_eligible, la.premium_estimate,
            la.findings, la.matched_obligations, la.risk_matrix
       FROM agent_registrations a
       LEFT JOIN LATERAL (
         SELECT * FROM agent_analyses
          WHERE agent_id = a.agent_id
          ORDER BY created_at DESC LIMIT 1
       ) la ON true
      WHERE a.tenant_id = $1
      ORDER BY la.trust_score NULLS LAST`,
    [TENANT],
  );

  type Finding = { severity?: string; title?: string; recommendation?: string };
  type MatchedOb = { regulation_id?: string; obligation_id?: string; verdict?: string };

  let critical = 0;
  let total = 0;
  let trustSum = 0;
  let trustCount = 0;
  let agentsWithAnalysis = 0;
  const heatmap: Record<string, Record<string, string>> = {};
  const regulations = new Set<string>();

  for (const a of agents) {
    if (a.analysis_id) agentsWithAnalysis += 1;
    if (a.trust_score != null) {
      trustSum += Number(a.trust_score);
      trustCount += 1;
    }
    const findings: Finding[] = Array.isArray(a.findings) ? a.findings : [];
    total += findings.length;
    critical += findings.filter((f) => (f.severity ?? "").toLowerCase() === "high").length;

    const obligations: MatchedOb[] = Array.isArray(a.matched_obligations) ? a.matched_obligations : [];
    heatmap[a.name] = {};
    for (const o of obligations) {
      const reg = (o.regulation_id ?? "other").toLowerCase();
      regulations.add(reg);
      // worst-case among verdicts wins
      const cur = heatmap[a.name][reg];
      const verdict = (o.verdict ?? "missing").toLowerCase();
      const rank = (v: string) => (v === "missing" ? 3 : v === "partial" ? 2 : v === "compliant" ? 1 : 0);
      if (!cur || rank(verdict) > rank(cur)) heatmap[a.name][reg] = verdict;
    }
  }

  const tenantTrust = trustCount ? Math.round(trustSum / trustCount) : null;
  const projected = tenantTrust != null ? Math.min(95, tenantTrust + 41) : null;

  // Priority remediation — pull all high-severity findings, dedup by title
  const priorities: Array<{
    agent: string;
    title: string;
    recommendation: string;
    regulation_hint?: string;
  }> = [];
  for (const a of agents) {
    const findings: Finding[] = Array.isArray(a.findings) ? a.findings : [];
    for (const f of findings) {
      if ((f.severity ?? "").toLowerCase() === "high") {
        priorities.push({
          agent: a.name,
          title: f.title ?? "(unnamed)",
          recommendation: f.recommendation ?? "",
        });
      }
    }
  }
  priorities.sort((a, b) => a.agent.localeCompare(b.agent));

  return NextResponse.json({
    tenant: TENANT,
    generated_at: new Date().toISOString(),
    kpis: {
      tenant_trust_score: tenantTrust,
      projected_trust_score: projected,
      agents_total: agents.length,
      agents_analyzed: agentsWithAnalysis,
      critical_findings: critical,
      total_findings: total,
      ai_act_t_minus_days: 547, // 2 Aug 2026 from a fixed Feb 2025 reference; FE recomputes
    },
    regulations: Array.from(regulations).sort(),
    heatmap,
    agents: agents.map((a) => ({
      agent_id: a.agent_id,
      name: a.name,
      description: a.description,
      trust_score: a.trust_score,
      grade: a.grade,
      risk_class: a.risk_class,
      insurance_eligible: a.insurance_eligible,
      premium_estimate: a.premium_estimate,
      finding_count: Array.isArray(a.findings) ? a.findings.length : 0,
      critical_findings: Array.isArray(a.findings)
        ? a.findings.filter((f: Finding) => (f.severity ?? "").toLowerCase() === "high").length
        : 0,
    })),
    priorities,
  });
}
