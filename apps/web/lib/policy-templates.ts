// Curated default policy templates that users can instantiate in 1 click.
// Each template carries a recommended weight and risk_categories mapping.

export type PolicyTemplate = {
  template_id: string;
  label: string;
  description: string;
  risk_categories: string[];
  weight: number; // 1..10 — used by the scoring formula
  mandatory: boolean;
  source: string; // citation hint (regulation/article)
};

export const POLICY_TEMPLATES: PolicyTemplate[] = [
  {
    template_id: "tpl_human_oversight_high_risk",
    label: "Human-in-the-loop on high-risk AI decisions",
    description:
      "Any final decision affecting fundamental rights, safety, or significant financial impact requires explicit human review and approval before being acted upon.",
    risk_categories: ["HUMAN_OVERSIGHT", "AI_GOVERNANCE"],
    weight: 10,
    mandatory: true,
    source: "EU AI Act Art. 14",
  },
  {
    template_id: "tpl_dpia_personal_data",
    label: "DPIA for personal-data processing",
    description:
      "Run a Data Protection Impact Assessment before any new agent that processes personal data goes live. Re-assess every 12 months or after material changes.",
    risk_categories: ["DATA_PROTECTION"],
    weight: 9,
    mandatory: true,
    source: "GDPR Art. 35",
  },
  {
    template_id: "tpl_special_category_block",
    label: "Block special-category data without legal basis",
    description:
      "Agents must not process race, health, biometrics, religion, sexual orientation, union membership unless an explicit Art. 9 legal basis is documented.",
    risk_categories: ["DATA_PROTECTION", "BIAS"],
    weight: 10,
    mandatory: true,
    source: "GDPR Art. 9",
  },
  {
    template_id: "tpl_bias_mitigation",
    label: "Bias mitigation and fairness testing",
    description:
      "Quarterly fairness audit (disparate impact on protected attributes) with documented mitigations. Block deploys that regress on fairness metrics.",
    risk_categories: ["BIAS", "AI_GOVERNANCE"],
    weight: 8,
    mandatory: false,
    source: "EU AI Act Art. 10",
  },
  {
    template_id: "tpl_transparency_disclosure",
    label: "Transparency disclosure to end-users",
    description:
      "Every conversational or content-generation agent must disclose to the user that they are interacting with AI, and offer human escalation.",
    risk_categories: ["TRANSPARENCY"],
    weight: 7,
    mandatory: true,
    source: "EU AI Act Art. 50",
  },
  {
    template_id: "tpl_dora_third_party_risk",
    label: "Third-party ICT risk register",
    description:
      "Every external model provider, vector DB or LLM API must be in the third-party ICT register, with contractual right-to-audit and exit plan.",
    risk_categories: ["THIRD_PARTY", "ICT_RISK"],
    weight: 8,
    mandatory: false,
    source: "DORA Art. 28",
  },
  {
    template_id: "tpl_incident_reporting",
    label: "Incident reporting <72h",
    description:
      "Any major AI incident (autonomous-decision failure, data leak, biased outcome with material harm) is reported to the DPO within 72 hours.",
    risk_categories: ["AUDIT", "AI_GOVERNANCE"],
    weight: 8,
    mandatory: true,
    source: "GDPR Art. 33 / DORA Art. 19",
  },
  {
    template_id: "tpl_audit_trail_decisions",
    label: "Tamper-evident audit log of decisions",
    description:
      "Every agent decision is persisted with input, output, model version, and policy snapshot. Logs retained 5 years, append-only.",
    risk_categories: ["AUDIT", "TRANSPARENCY"],
    weight: 7,
    mandatory: false,
    source: "EU AI Act Art. 12",
  },
  {
    template_id: "tpl_security_secrets",
    label: "Secrets in managed vault only",
    description:
      "Agents must never include API keys / DB credentials in prompts, code, or config. Use Secret Manager with rotated KEYs.",
    risk_categories: ["SECURITY", "ICT_RISK"],
    weight: 9,
    mandatory: true,
    source: "DORA Art. 9",
  },
  {
    template_id: "tpl_model_cards",
    label: "Maintain a public model card",
    description:
      "Every production agent must publish an up-to-date model card describing intended use, limits, training data summary, and known failure modes.",
    risk_categories: ["TRANSPARENCY", "AI_GOVERNANCE"],
    weight: 6,
    mandatory: false,
    source: "EU AI Act Annex IV",
  },
  {
    template_id: "tpl_red_team_quarterly",
    label: "Quarterly red-team / jailbreak tests",
    description:
      "Adversarial testing every quarter against prompt-injection, data exfiltration, and unsafe-tool-use scenarios. Findings feed the risk register.",
    risk_categories: ["SECURITY", "AI_GOVERNANCE"],
    weight: 7,
    mandatory: false,
    source: "EU AI Act Art. 9",
  },
  {
    template_id: "tpl_user_consent",
    label: "Explicit, granular user consent",
    description:
      "Opt-in consent collected per processing purpose. Withdrawal as easy as opt-in, propagated to all downstream systems within 7 days.",
    risk_categories: ["DATA_PROTECTION", "TRANSPARENCY"],
    weight: 8,
    mandatory: true,
    source: "GDPR Art. 7",
  },
];
