"""Seed catalogue of INTEGREAT policies (>=30 entries)."""
from __future__ import annotations

from integreat_policies.models import Policy


def _p(
    pid: str,
    label: str,
    *,
    parent: str | None = None,
    mandatory: bool = False,
    risk_categories: list[str] | None = None,
    description: str | None = None,
) -> Policy:
    return Policy(
        id=pid,
        label=label,
        parent_id=parent,
        mandatory=mandatory,
        risk_categories=risk_categories or [],
        description=description,
    )


POLICIES_SEED: list[Policy] = [
    # AI Act ---------------------------------------------------------------
    _p("ai_act.applicability", "AI Act — applicability", mandatory=True,
       risk_categories=["ai_governance"], description="Determine whether the system is in scope of the AI Act."),
    _p("ai_act.high_risk.credit_scoring", "AI Act — high-risk: credit scoring",
       parent="ai_act.applicability",
       risk_categories=["bias", "transparency", "human_oversight"]),
    _p("ai_act.high_risk.fraud_detection", "AI Act — high-risk: fraud detection",
       parent="ai_act.applicability",
       risk_categories=["security", "transparency", "incident"]),
    _p("ai_act.high_risk.aml_kyc", "AI Act — high-risk: AML/KYC",
       parent="ai_act.applicability",
       risk_categories=["data_protection", "transparency", "ai_governance"]),
    _p("ai_act.high_risk.recruitment", "AI Act — high-risk: recruitment",
       parent="ai_act.applicability",
       risk_categories=["bias", "ethical_social", "human_oversight"]),
    _p("ai_act.gpai.foundation_models", "AI Act — GPAI / foundation models",
       parent="ai_act.applicability",
       risk_categories=["transparency", "third_party"]),
    _p("ai_act.transparency.disclosure", "AI Act — transparency & disclosure",
       parent="ai_act.applicability",
       risk_categories=["transparency"]),
    _p("ai_act.human_oversight", "AI Act — human oversight",
       parent="ai_act.applicability",
       risk_categories=["human_oversight"]),

    # DORA -----------------------------------------------------------------
    _p("dora.ict_risk_management", "DORA — ICT risk management", mandatory=True,
       risk_categories=["ict_risk", "ai_governance"]),
    _p("dora.third_party_risk", "DORA — ICT third-party risk",
       parent="dora.ict_risk_management",
       risk_categories=["third_party"]),
    _p("dora.incident_reporting", "DORA — incident reporting",
       parent="dora.ict_risk_management",
       risk_categories=["incident"]),
    _p("dora.testing_resilience", "DORA — operational resilience testing",
       parent="dora.ict_risk_management",
       risk_categories=["ict_risk", "security"]),
    _p("dora.threat_led_pen_test", "DORA — threat-led penetration testing",
       parent="dora.ict_risk_management",
       risk_categories=["security"]),

    # GDPR -----------------------------------------------------------------
    _p("gdpr.applicability", "GDPR — applicability", mandatory=True,
       risk_categories=["data_protection"]),
    _p("gdpr.automated_decision", "GDPR — automated decision-making (Art. 22)",
       parent="gdpr.applicability",
       risk_categories=["data_protection", "transparency", "human_oversight"]),
    _p("gdpr.dpia", "GDPR — DPIA", parent="gdpr.applicability",
       risk_categories=["data_protection", "ai_governance"]),
    _p("gdpr.lawful_basis", "GDPR — lawful basis", parent="gdpr.applicability",
       risk_categories=["data_protection"]),
    _p("gdpr.data_minimisation", "GDPR — data minimisation",
       parent="gdpr.applicability",
       risk_categories=["data_protection"]),
    _p("gdpr.right_to_explain", "GDPR — right to explanation",
       parent="gdpr.applicability",
       risk_categories=["transparency", "data_protection"]),

    # MiCA -----------------------------------------------------------------
    _p("mica.casp.licensing", "MiCA — CASP licensing",
       risk_categories=["ai_governance"]),
    _p("mica.token.classification", "MiCA — token classification",
       parent="mica.casp.licensing",
       risk_categories=["ai_governance"]),

    # ISO 42001 ------------------------------------------------------------
    _p("iso_42001.management_system", "ISO/IEC 42001 — AI management system",
       risk_categories=["ai_governance"]),
    _p("iso_42001.ai_risk_assessment", "ISO/IEC 42001 — AI risk assessment",
       parent="iso_42001.management_system",
       risk_categories=["ai_governance", "incident"]),
    _p("iso_42001.data_quality", "ISO/IEC 42001 — data quality for AI",
       parent="iso_42001.management_system",
       risk_categories=["data_protection", "bias"]),

    # NIST AI RMF ----------------------------------------------------------
    _p("nist_ai_rmf.govern", "NIST AI RMF — GOVERN",
       risk_categories=["ai_governance"]),
    _p("nist_ai_rmf.map", "NIST AI RMF — MAP",
       parent="nist_ai_rmf.govern",
       risk_categories=["ai_governance"]),
    _p("nist_ai_rmf.measure", "NIST AI RMF — MEASURE",
       parent="nist_ai_rmf.govern",
       risk_categories=["bias", "security", "transparency"]),
    _p("nist_ai_rmf.manage", "NIST AI RMF — MANAGE",
       parent="nist_ai_rmf.govern",
       risk_categories=["incident", "ai_governance"]),

    # OWASP LLM Top 10 -----------------------------------------------------
    _p("owasp_llm.prompt_injection", "OWASP LLM — prompt injection",
       risk_categories=["prompt_injection", "security"]),
    _p("owasp_llm.insecure_output", "OWASP LLM — insecure output handling",
       risk_categories=["security"]),
    _p("owasp_llm.training_data_poisoning", "OWASP LLM — training data poisoning",
       risk_categories=["security", "bias"]),
    _p("owasp_llm.excessive_agency", "OWASP LLM — excessive agency",
       risk_categories=["human_oversight", "security"]),
]


def list_seed_policies(tenant_id: str | None = None) -> list[Policy]:
    """Return a deep copy of seed policies optionally stamped with a tenant_id."""
    out: list[Policy] = []
    for p in POLICIES_SEED:
        out.append(p.model_copy(update={"tenant_id": tenant_id}))
    return out
