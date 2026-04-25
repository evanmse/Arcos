export type Policy = {
  id: string;
  label: string;
  parent_id: string | null;
  enabled: boolean;
  mandatory: boolean;
  mapped_obligations: string[];
  risk_categories: string[];
  description: string | null;
  tenant_id: string | null;
};

export type StandardSection = {
  section_id: string;
  title: string;
  chapter: string | null;
  text: string;
};

export type InsuranceClause = {
  clause_id: string;
  clause_type: "coverage" | "exclusion" | "condition" | "deductible" | "limit";
  title: string;
  text: string;
  applicable_risk_categories: string[];
  min_trust_score: number | null;
};

export type RiskDimension =
  | "technical"
  | "legal"
  | "ethical_social"
  | "financial"
  | "economic";

export type TrustScore = {
  technical: number;
  legal: number;
  ethical_social: number;
  global: number;
  grade: "A" | "B" | "C" | "D" | "E";
  weights: Record<string, number>;
  sub_scores: Record<string, number>;
};

export type EvaluationResult = {
  agent_id: string;
  agent_name: string;
  github_url: string;
  trust_score: TrustScore;
  matched_obligations: string[];
  matched_policies: string[];
  insurance_recommendations: Array<{
    catalog_id: string;
    partner: string;
    eligible: boolean;
    matching_clauses: string[];
    rejected_reason: string | null;
  }>;
  bias_flags: string[];
  generated_at: string;
};
