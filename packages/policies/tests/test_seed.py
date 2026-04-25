"""Tests for the policies seed."""
from __future__ import annotations

from integreat_policies.seed import POLICIES_SEED, list_seed_policies
from integreat_policies.validator import validate_dependencies


def test_seed_has_at_least_25_policies() -> None:
    assert len(POLICIES_SEED) >= 25


def test_seed_dependencies_are_consistent() -> None:
    # Every parent_id must point to another policy in the seed.
    validate_dependencies(POLICIES_SEED)


def test_seed_contains_mandatory_anchors() -> None:
    mandatory_ids = {p.id for p in POLICIES_SEED if p.mandatory}
    assert {"ai_act.applicability", "dora.ict_risk_management", "gdpr.applicability"} <= mandatory_ids


def test_list_seed_policies_stamps_tenant_id() -> None:
    out = list_seed_policies(tenant_id="acme")
    assert all(p.tenant_id == "acme" for p in out)
    assert {p.id for p in out} == {p.id for p in POLICIES_SEED}


def test_seed_covers_all_required_domains() -> None:
    ids = {p.id for p in POLICIES_SEED}
    must_have = {
        "ai_act.high_risk.credit_scoring",
        "ai_act.gpai.foundation_models",
        "dora.third_party_risk",
        "gdpr.automated_decision",
        "gdpr.dpia",
        "iso_42001.management_system",
        "nist_ai_rmf.govern",
        "owasp_llm.prompt_injection",
    }
    assert must_have <= ids
