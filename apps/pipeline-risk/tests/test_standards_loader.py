"""Tests for the standards loader (ISO/NIST/OWASP local JSON catalogues)."""
from __future__ import annotations

from pathlib import Path

import pytest

from pipeline_risk.crawlers.standards import load_standard

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


@pytest.mark.parametrize(
    "standard_id,min_sections",
    [
        ("iso_42001", 6),
        ("iso_23894", 4),
        ("nist_ai_rmf", 8),
        ("owasp_llm_top10", 10),
    ],
)
def test_load_standard_returns_validated_sections(standard_id: str, min_sections: int) -> None:
    sections = load_standard(standard_id, DATA_DIR)
    assert len(sections) >= min_sections
    for section in sections:
        assert section.standard_id == standard_id
        assert section.section_id.strip()
        assert section.title.strip()
        assert len(section.text) > 30


def test_load_standard_unknown_raises() -> None:
    with pytest.raises(FileNotFoundError):
        load_standard("nonexistent", DATA_DIR)


def test_owasp_top10_uses_llm_codes() -> None:
    sections = load_standard("owasp_llm_top10", DATA_DIR)
    codes = {s.section_id.upper() for s in sections}
    assert {f"LLM{i:02d}" for i in range(1, 11)} <= codes
