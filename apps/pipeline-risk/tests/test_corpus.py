"""Tests for the corpus catalogue (regulations + standards + insurance)."""
from __future__ import annotations

from pipeline_risk.corpus import (
    INSURANCE_CATALOGS,
    REGULATIONS,
    STANDARDS,
    get_regulation,
    list_regulations,
)


def test_regulations_contains_four_eu_acts() -> None:
    assert {"ai_act", "dora", "rgpd", "mica"} <= set(REGULATIONS.keys())
    assert REGULATIONS["ai_act"].celex == "32024R1689"
    assert REGULATIONS["dora"].celex == "32022R2554"


def test_standards_cover_iso_nist_owasp() -> None:
    assert {"iso_42001", "iso_23894", "nist_ai_rmf", "owasp_llm_top10"} <= set(STANDARDS.keys())


def test_insurance_catalogs_cover_three_partners() -> None:
    assert {"munichre", "hiscox", "axaxl"} == set(INSURANCE_CATALOGS.keys())


def test_get_regulation_helpers() -> None:
    regs = list_regulations()
    assert len(regs) >= 4
    assert get_regulation("ai_act").short_name == "AI Act"
