import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getPool } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";

export const dynamic = "force-dynamic";
const TENANT = "default";

type SeedAgent = {
  agent_id: string;
  name: string;
  repo_url: string;
  path: string;
  description: string;
  trust_score: number;
  grade: string;
  risk_class: string;
  insurance_eligible: boolean;
  premium_estimate: number;
  findings: any[];
  matched_obligations: any[];
  matched_policies: any[];
  report_md: string;
  risk_matrix: Record<string, { likelihood: number; impact: number }>;
};

const VOLTA_AGENTS: SeedAgent[] = [
  {
    agent_id: "ag-volta-kycvision",
    name: "kyc-vision",
    repo_url: "https://github.com/voltabank/kyc-vision",
    path: "services/onboarding/kyc-vision",
    description:
      "Biometric onboarding stack — OCR + liveness CNN + face-match. Triton GPU. APPROVE / REJECT / MANUAL_REVIEW.",
    trust_score: 38,
    grade: "D",
    risk_class: "high",
    insurance_eligible: false,
    premium_estimate: 0,
    risk_matrix: {
      data_governance: { likelihood: 5, impact: 5 },
      transparency: { likelihood: 4, impact: 4 },
      human_oversight: { likelihood: 5, impact: 4 },
      robustness: { likelihood: 4, impact: 5 },
      record_keeping: { likelihood: 3, impact: 4 },
    },
    findings: [
      {
        severity: "high",
        title: "Training set bias on Fitzpatrick V/VI",
        evidence:
          "78% Caucasian faces in training data. False-rejection rate 6× higher on darker skin tones.",
        recommendation:
          "Rebalance training set; document representativeness vs. protected characteristics (AI Act Art. 10).",
      },
      {
        severity: "high",
        title: "Manual review queue understaffed",
        evidence:
          "3 ops people for 1.4M users — effective wait time 11 days. Not effective oversight.",
        recommendation:
          "Scale review team or redirect MANUAL_REVIEW to async with 48h SLA (AI Act Art. 14).",
      },
      {
        severity: "medium",
        title: "No adversarial deepfake red-team",
        evidence: "Public benchmarks suggest commercial liveness fails 18–30% on modern deepfakes.",
        recommendation: "Quarterly adversarial red-team with documented results (Art. 15).",
      },
      {
        severity: "high",
        title: "Biometric data without explicit consent",
        evidence: "Relies on Art. 6(1)(b) contractual necessity, contested by EDPB.",
        recommendation: "Explicit consent flow + DPIA (RGPD Art. 9).",
      },
    ],
    matched_obligations: [
      { regulation_id: "ai_act", obligation_id: "AIACT-10", verdict: "missing", rationale: "Training data not representative." },
      { regulation_id: "ai_act", obligation_id: "AIACT-13", verdict: "partial", rationale: "Disclosure in T&Cs only." },
      { regulation_id: "ai_act", obligation_id: "AIACT-14", verdict: "missing", rationale: "11-day review wait." },
      { regulation_id: "ai_act", obligation_id: "AIACT-15", verdict: "missing", rationale: "No adversarial red-team." },
      { regulation_id: "gdpr", obligation_id: "GDPR-9", verdict: "missing", rationale: "Special-category data without explicit consent." },
    ],
    matched_policies: [],
    report_md: `# kyc-vision — Biometric onboarding\n\n**Risk class:** Annex III §1(a) — biometric identification & categorisation. **HIGH-RISK.**\n\nThree CNN heads run sequentially on Triton GPU: OCR, liveness, face-match. Onfido as backstop. Trust score 38/100 — uninsurable in current state. Critical fixes: rebalance training set, scale manual review, run adversarial red-team, deploy explicit-consent flow.`,
  },
  {
    agent_id: "ag-volta-creditgrade",
    name: "creditgrade",
    repo_url: "https://github.com/voltabank/creditgrade",
    path: "services/credit/creditgrade",
    description:
      "XGBoost credit scoring — overdraft, BNPL, personal loans. GPT-4 wrapper for letters. Quarterly retraining.",
    trust_score: 41,
    grade: "D",
    risk_class: "high",
    insurance_eligible: false,
    premium_estimate: 0,
    risk_matrix: {
      data_governance: { likelihood: 5, impact: 5 },
      transparency: { likelihood: 5, impact: 4 },
      human_oversight: { likelihood: 5, impact: 5 },
      record_keeping: { likelihood: 5, impact: 4 },
      robustness: { likelihood: 3, impact: 4 },
    },
    findings: [
      {
        severity: "high",
        title: "+23% / +31% approval-rate gaps on age & CSP",
        evidence:
          "Postcode is a French ethnicity proxy; first-name correlates with origin. Significant disparity at otherwise-identical income.",
        recommendation: "Bias remediation pipeline + before/after metrics (Art. 10).",
      },
      {
        severity: "high",
        title: "Solely-automated decision below 0.30 threshold",
        evidence: "Auto-reject without human gate. RGPD Art. 22 violation.",
        recommendation: "Insert human-in-the-loop, expose right to human intervention.",
      },
      {
        severity: "high",
        title: "Input feature snapshot not retained",
        evidence: "Decisions logged but inputs not — past decisions unreproducible. Required: 10y.",
        recommendation: "Immutable decision-input store (Art. 12).",
      },
      {
        severity: "high",
        title: "Rejection letters lack top-feature explanation",
        evidence: "\"Application not approved\" with no reason. AI Act + RGPD Art. 13/15 require meaningful info.",
        recommendation: "Generate per-decision feature attribution (SHAP) and surface in letter.",
      },
      {
        severity: "medium",
        title: "Selection-bias feedback loop",
        evidence: "Quarterly retraining only sees outcomes for approved applicants.",
        recommendation: "Counterfactual / reject-inference methodology.",
      },
    ],
    matched_obligations: [
      { regulation_id: "ai_act", obligation_id: "AIACT-10", verdict: "missing", rationale: "Disparate impact on age/CSP." },
      { regulation_id: "ai_act", obligation_id: "AIACT-12", verdict: "missing", rationale: "Inputs not retained." },
      { regulation_id: "ai_act", obligation_id: "AIACT-13", verdict: "missing", rationale: "No feature attribution to user." },
      { regulation_id: "ai_act", obligation_id: "AIACT-14", verdict: "missing", rationale: "Auto-reject without human gate." },
      { regulation_id: "gdpr", obligation_id: "GDPR-22", verdict: "missing", rationale: "Solely automated decision." },
    ],
    matched_policies: [],
    report_md: `# creditgrade — XGBoost credit scoring\n\n**Risk class:** Annex III §5(b) — creditworthiness assessment. **HIGH-RISK.**\n\nFeatures include 12-month transactions, salary, postcode, age. 3-threshold gating: auto-approve, auto-reject, manual. Trust score 41/100. Critical: bias on age/CSP, no human gate on auto-reject, inputs not retained, rejection letters lack feature attribution.`,
  },
  {
    agent_id: "ag-volta-fraudnet",
    name: "fraudnet",
    repo_url: "https://github.com/voltabank/fraudnet",
    path: "services/payments/fraudnet",
    description:
      "Real-time GraphSAGE GNN — 12k tx/sec at peak. Sub-50ms. BLOCK / HOLD / STEP_UP / ALLOW.",
    trust_score: 52,
    grade: "C",
    risk_class: "high",
    insurance_eligible: true,
    premium_estimate: 78_000,
    risk_matrix: {
      human_oversight: { likelihood: 5, impact: 5 },
      data_governance: { likelihood: 4, impact: 4 },
      record_keeping: { likelihood: 5, impact: 4 },
      ict_risk: { likelihood: 3, impact: 5 },
      third_party: { likelihood: 4, impact: 3 },
    },
    findings: [
      {
        severity: "high",
        title: "Account freezes without human-review SLA",
        evidence: "Some users frozen 11 days. 8 400 active freezes at any time.",
        recommendation: "24h human-review SLA on every BLOCK + dashboard for ops (Art. 14).",
      },
      {
        severity: "high",
        title: "4× false-positive rate on non-EU IPs",
        evidence: "US-sourced IP-reputation database over-represents US-fraud patterns.",
        recommendation: "Replace or augment with EU-sourced telemetry; document residual disparity.",
      },
      {
        severity: "high",
        title: "PSD2 RTS Art. 18 — inconsistent SCA application",
        evidence: "4× geographic disparity → SCA exemptions unreliable → direct PSD2 breach.",
        recommendation: "Recalibrate risk-based SCA per RTS Art. 18.",
      },
      {
        severity: "high",
        title: "Local subgraph not retained → unreviewable decisions",
        evidence: "Which subgraph triggered the score is lost.",
        recommendation: "Persist k-hop subgraph snapshot per decision (Art. 12).",
      },
    ],
    matched_obligations: [
      { regulation_id: "ai_act", obligation_id: "AIACT-14", verdict: "missing", rationale: "No SLA on freeze review." },
      { regulation_id: "ai_act", obligation_id: "AIACT-12", verdict: "missing", rationale: "Subgraph not stored." },
      { regulation_id: "dora", obligation_id: "DORA-17", verdict: "partial", rationale: "Outage incident reporting partial." },
      { regulation_id: "gdpr", obligation_id: "GDPR-15", verdict: "missing", rationale: "Cannot extract user subgraph for SAR." },
    ],
    matched_policies: [],
    report_md: `# fraudnet — Graph neural network\n\n**Risk class:** ambiguous on architecture; **HIGH-RISK by output** when freezes affect access to payments (8 400 active freezes).\n\nGraphSAGE — users / merchants / devices / IPs / cards. Trust score 52/100. Insurable but priced for risk. Critical fixes: 24h freeze SLA, EU-sourced IP reputation, persistent subgraph store, recalibrate SCA.`,
  },
  {
    agent_id: "ag-volta-nudgegpt",
    name: "nudge-gpt",
    repo_url: "https://github.com/voltabank/nudge-gpt",
    path: "services/engagement/nudge-gpt",
    description:
      "Claude-powered savings nudges. 36M generations/year. One-click auto-set-aside executes a transaction.",
    trust_score: 47,
    grade: "D",
    risk_class: "high",
    insurance_eligible: false,
    premium_estimate: 0,
    risk_matrix: {
      record_keeping: { likelihood: 5, impact: 5 },
      transparency: { likelihood: 4, impact: 4 },
      third_party: { likelihood: 4, impact: 5 },
      data_protection: { likelihood: 4, impact: 5 },
      audit: { likelihood: 4, impact: 4 },
    },
    findings: [
      {
        severity: "high",
        title: "36M generations/year — rendered nudge not stored",
        evidence: "API request/response logged but final templated nudge as delivered is not.",
        recommendation: "Persist rendered output with channel + timestamp (Art. 12).",
      },
      {
        severity: "high",
        title: "MiFID II — informational nudges crossing into advice",
        evidence: "\"Put €50 in your Livret A\" is regulated advice, not information.",
        recommendation: "Suitability filter or remove specific-action wording.",
      },
      {
        severity: "high",
        title: "12 months of transaction history sent to Anthropic (US)",
        evidence: "International transfer + data minimisation gap.",
        recommendation: "EU-residency inference (Mistral) or contractually bind Anthropic to EU. SCC + DPA.",
      },
      {
        severity: "high",
        title: "Vulnerability filtering missing",
        evidence: "Persuasive nudges sent to customers in active financial distress (NSF, missed DD).",
        recommendation: "Hard filter + DPIA on vulnerability segments (AI Act Art. 5).",
      },
      {
        severity: "medium",
        title: "Hallucinations on balance / transactions",
        evidence: "Red-team found 9 fabricated facts.",
        recommendation: "Constrained generation + post-hoc verification against ledger.",
      },
    ],
    matched_obligations: [
      { regulation_id: "ai_act", obligation_id: "AIACT-12", verdict: "missing", rationale: "Final nudge not retained." },
      { regulation_id: "ai_act", obligation_id: "AIACT-52", verdict: "missing", rationale: "No per-message AI label." },
      { regulation_id: "gdpr", obligation_id: "GDPR-44", verdict: "partial", rationale: "International transfer to Anthropic." },
      { regulation_id: "dora", obligation_id: "DORA-28", verdict: "missing", rationale: "No exit strategy on Anthropic." },
    ],
    matched_policies: [],
    report_md: `# nudge-gpt — Claude savings nudges\n\n**Risk class:** LIMITED on framing; **HIGH-RISK by output** (auto-set-aside moves money).\n\n36M generations/year. Trust 47/100. Critical: store rendered output, MiFID-II suitability or rephrase advice, EU-residency inference, vulnerability filtering, hallucination guardrails.`,
  },
  {
    agent_id: "ag-volta-supportbot",
    name: "support-bot Léa",
    repo_url: "https://github.com/voltabank/support-bot",
    path: "services/support/lea",
    description:
      "Mistral Large + RAG on internal KB. Tool-use enabled — incl. account closure after 48h silence.",
    trust_score: 33,
    grade: "E",
    risk_class: "high",
    insurance_eligible: false,
    premium_estimate: 0,
    risk_matrix: {
      human_oversight: { likelihood: 5, impact: 5 },
      robustness: { likelihood: 5, impact: 5 },
      record_keeping: { likelihood: 5, impact: 4 },
      transparency: { likelihood: 4, impact: 3 },
      audit: { likelihood: 4, impact: 4 },
    },
    findings: [
      {
        severity: "high",
        title: "48h silence as account-closure consent — slam-dunk RGPD Art. 22",
        evidence: "Solely automated decision with significant effect on financial-services access.",
        recommendation: "Kill auto-confirm. Require explicit user click + human review.",
      },
      {
        severity: "high",
        title: "Prompt injection — 4 successful red-team attacks",
        evidence: "Revealed system prompt; attempted unauthorised password reset on a sibling account.",
        recommendation: "Tool-use scoping per session, prompt-injection filter, sandboxed tool exec.",
      },
      {
        severity: "high",
        title: "Conversation retention 90d (high-risk = 10y)",
        evidence: "Tool-call provenance also missing.",
        recommendation: "10-year retention + structured tool-call log (Art. 12).",
      },
      {
        severity: "medium",
        title: "No persistent AI disclosure",
        evidence: "\"Bonjour, je suis Léa de Volta\" — customers learn it's AI only if they ask.",
        recommendation: "Persistent badge / footer disclosure (Art. 52).",
      },
    ],
    matched_obligations: [
      { regulation_id: "ai_act", obligation_id: "AIACT-14", verdict: "missing", rationale: "Auto account closure." },
      { regulation_id: "ai_act", obligation_id: "AIACT-15", verdict: "missing", rationale: "Prompt injection vulns." },
      { regulation_id: "ai_act", obligation_id: "AIACT-12", verdict: "missing", rationale: "90d retention." },
      { regulation_id: "ai_act", obligation_id: "AIACT-52", verdict: "partial", rationale: "Initial greeting only." },
      { regulation_id: "gdpr", obligation_id: "GDPR-22", verdict: "missing", rationale: "Auto-closure = automated decision." },
    ],
    matched_policies: [],
    report_md: `# support-bot Léa — Mistral first-line\n\n**Risk class:** LIMITED on architecture; **HIGH-RISK by output** via account-closure tool.\n\nTrust 33/100 — lowest of the fleet. Single highest-leverage fix in 2 weeks: kill the 48h auto-confirm. Then prompt-injection hardening, 10-year retention, persistent AI disclosure.`,
  },
];

export async function POST() {
  const pool = getPool();
  await ensureSchema(pool);

  // Make sure agent registration exists; reset analyses to keep history fresh
  for (const a of VOLTA_AGENTS) {
    await pool.query(
      `INSERT INTO agent_registrations (agent_id, tenant_id, name, repo_url, path, description, status)
       VALUES ($1,$2,$3,$4,$5,$6,'analyzed')
       ON CONFLICT (agent_id) DO UPDATE SET
         name=EXCLUDED.name, repo_url=EXCLUDED.repo_url, path=EXCLUDED.path,
         description=EXCLUDED.description, status='analyzed', updated_at=now()`,
      [a.agent_id, TENANT, a.name, a.repo_url, a.path, a.description],
    );

    const analysisId = "an-volta-" + crypto.randomBytes(4).toString("hex");
    await pool.query(
      `INSERT INTO agent_analyses
         (analysis_id, agent_id, tenant_id, model, trust_score, grade, risk_class,
          insurance_eligible, premium_estimate, findings, matched_obligations,
          matched_policies, report_md, risk_matrix)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb,$12::jsonb,$13,$14::jsonb)`,
      [
        analysisId,
        a.agent_id,
        TENANT,
        "gemini-2.5-pro",
        a.trust_score,
        a.grade,
        a.risk_class,
        a.insurance_eligible,
        a.premium_estimate,
        JSON.stringify(a.findings),
        JSON.stringify(a.matched_obligations),
        JSON.stringify(a.matched_policies),
        a.report_md,
        JSON.stringify(a.risk_matrix),
      ],
    );
  }

  return NextResponse.json({
    ok: true,
    seeded: VOLTA_AGENTS.length,
    company: "Volta Bank",
  });
}

export async function DELETE() {
  const pool = getPool();
  for (const a of VOLTA_AGENTS) {
    await pool.query(`DELETE FROM agent_analyses WHERE agent_id=$1`, [a.agent_id]);
    await pool.query(`DELETE FROM agent_registrations WHERE agent_id=$1`, [a.agent_id]);
  }
  return NextResponse.json({ ok: true });
}
