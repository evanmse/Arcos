"""Tests for the insurance catalog loader (Munich Re / Hiscox / AXA XL)."""
from __future__ import annotations

from pathlib import Path

import pytest

from pipeline_risk.insurance.loader import load_insurance_catalog

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
ALLOWED_TYPES = {"coverage", "exclusion", "condition", "deductible", "limit"}


@pytest.mark.parametrize("catalog_id", ["munichre", "hiscox", "axaxl"])
def test_load_insurance_catalog_returns_clauses(catalog_id: str) -> None:
    clauses = load_insurance_catalog(catalog_id, DATA_DIR)
    assert len(clauses) >= 5
    for clause in clauses:
        assert clause.catalog_id == catalog_id
        assert clause.clause_type in ALLOWED_TYPES
        assert clause.title and clause.text
        if clause.min_trust_score is not None:
            assert 0 <= clause.min_trust_score <= 100


def test_munichre_has_coverage_and_exclusion_clauses() -> None:
    clauses = load_insurance_catalog("munichre", DATA_DIR)
    types = {c.clause_type for c in clauses}
    assert "coverage" in types
    assert "exclusion" in types


def test_load_unknown_catalog_raises() -> None:
    with pytest.raises(FileNotFoundError):
        load_insurance_catalog("doesnotexist", DATA_DIR)
