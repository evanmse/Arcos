import type { EvaluationResult, InsuranceClause, Policy } from "./types";

/**
 * Mock evaluator — deterministic Trust Score 3D from a pseudo-hash of the URL.
 * In Phase 5 this will be replaced by the LangGraph orchestrator + sandbox runs.
 */
export function mockEvaluate({
  githubUrl,
  agentName,
  policies,
  insuranceCatalogs,
}: {
  githubUrl: string;
  agentName: string;
  policies: Policy[];
  insuranceCatalogs: Record<string, InsuranceClause[]>;
}): EvaluationResult {
  const seed = hashCode(githubUrl + agentName);
  const technical = clamp(50 + (seed % 50), 0, 100);
  const legal = clamp(40 + ((seed * 7) % 60), 0, 100);
  const ethical = clamp(45 + ((seed * 13) % 55), 0, 100);

  const weights = { technical: 0.4, legal: 0.35, ethical_social: 0.25 };
  const global =
    technical * weights.technical +
    legal * weights.legal +
    ethical * weights.ethical_social;

  const grade = scoreToGrade(global);

  const enabled = policies.filter((p) => p.enabled);
  const matchedPolicies = enabled
    .filter((p) => (seed + hashCode(p.id)) % 3 !== 0)
    .map((p) => p.id);

  const matchedObligations = enabled
    .flatMap((p) => p.mapped_obligations)
    .filter((_, i) => i % 2 === 0);

  const enabledRiskCategories = new Set(
    enabled.flatMap((p) => p.risk_categories),
  );

  const insurance_recommendations = Object.entries(insuranceCatalogs).map(
    ([catalog_id, clauses]) => {
      const partner =
        catalog_id === "munichre"
          ? "Munich Re"
          : catalog_id === "hiscox"
            ? "Hiscox"
            : "AXA XL";
      const minScore = Math.max(
        0,
        ...clauses
          .map((c) => c.min_trust_score ?? 0)
          .filter((s) => s > 0)
          .slice(0, 1),
      );
      const eligible = global >= minScore;
      const matching_clauses = clauses
        .filter((c) =>
          c.applicable_risk_categories.some((rc) =>
            enabledRiskCategories.has(rc),
          ),
        )
        .map((c) => c.clause_id);
      return {
        catalog_id,
        partner,
        eligible,
        matching_clauses,
        rejected_reason: eligible
          ? null
          : `Trust Score ${global.toFixed(1)} < seuil minimum ${minScore}`,
      };
    },
  );

  const bias_flags =
    ethical < 60
      ? ["demographic_parity_warning", "equal_opportunity_warning"]
      : ethical < 75
        ? ["demographic_parity_warning"]
        : [];

  return {
    agent_id: `agent_${seed.toString(16)}`,
    agent_name: agentName,
    github_url: githubUrl,
    trust_score: {
      technical,
      legal,
      ethical_social: ethical,
      global: Number(global.toFixed(1)),
      grade,
      weights,
      sub_scores: {
        prompt_injection_resistance: clamp(technical - 5, 0, 100),
        bias_audit: clamp(ethical - 3, 0, 100),
        regulatory_alignment: clamp(legal + 2, 0, 100),
        hallucination_rate: clamp(100 - (seed % 30), 0, 100),
        data_protection: clamp(legal - 4, 0, 100),
      },
    },
    matched_obligations: matchedObligations,
    matched_policies: matchedPolicies,
    insurance_recommendations,
    bias_flags,
    generated_at: new Date().toISOString(),
  };
}

function hashCode(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

function scoreToGrade(score: number): "A" | "B" | "C" | "D" | "E" {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "E";
}
