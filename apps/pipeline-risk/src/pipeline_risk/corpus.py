"""Catalogue of risk sources : regulations, standards, insurance partners."""
from __future__ import annotations

from pipeline_risk.models import InsuranceCatalog, Regulation, Standard

REGULATIONS: dict[str, Regulation] = {
    "ai_act": Regulation(
        regulation_id="ai_act",
        celex="32024R1689",
        title="Regulation (EU) 2024/1689 — AI Act",
        short_name="AI Act",
        publication_date="2024-07-12",
        domain="AI",
    ),
    "dora": Regulation(
        regulation_id="dora",
        celex="32022R2554",
        title="Regulation (EU) 2022/2554 — DORA",
        short_name="DORA",
        publication_date="2022-12-27",
        domain="ICT_RISK",
    ),
    "rgpd": Regulation(
        regulation_id="rgpd",
        celex="32016R0679",
        title="Regulation (EU) 2016/679 — GDPR",
        short_name="GDPR",
        publication_date="2016-04-27",
        domain="DATA_PROTECTION",
    ),
    "mica": Regulation(
        regulation_id="mica",
        celex="32023R1114",
        title="Regulation (EU) 2023/1114 — MiCA",
        short_name="MiCA",
        publication_date="2023-06-09",
        domain="CRYPTO",
    ),
}

# Backwards-compat alias for the old `CORPUS` symbol.
CORPUS = REGULATIONS


STANDARDS: dict[str, Standard] = {
    "iso_42001": Standard(
        standard_id="iso_42001",
        title="ISO/IEC 42001 — AI management system",
        version="2023",
    ),
    "iso_23894": Standard(
        standard_id="iso_23894",
        title="ISO/IEC 23894 — AI risk management",
        version="2023",
    ),
    "nist_ai_rmf": Standard(
        standard_id="nist_ai_rmf",
        title="NIST AI Risk Management Framework",
        version="1.0",
    ),
    "owasp_llm_top10": Standard(
        standard_id="owasp_llm_top10",
        title="OWASP Top 10 for LLM Applications",
        version="2025",
    ),
}


INSURANCE_CATALOGS: dict[str, InsuranceCatalog] = {
    "munichre": InsuranceCatalog(catalog_id="munichre", name="Munich Re — AI liability", partner="Munich Re"),
    "hiscox": InsuranceCatalog(catalog_id="hiscox", name="Hiscox — AI E&O", partner="Hiscox"),
    "axaxl": InsuranceCatalog(catalog_id="axaxl", name="AXA XL — Enterprise AI liability", partner="AXA XL"),
}


def list_regulations() -> list[Regulation]:
    return list(REGULATIONS.values())


def get_regulation(regulation_id: str) -> Regulation:
    return REGULATIONS[regulation_id]


def list_standards() -> list[Standard]:
    return list(STANDARDS.values())


def get_standard(standard_id: str) -> Standard:
    return STANDARDS[standard_id]


def list_insurance_catalogs() -> list[InsuranceCatalog]:
    return list(INSURANCE_CATALOGS.values())


def get_insurance_catalog(catalog_id: str) -> InsuranceCatalog:
    return INSURANCE_CATALOGS[catalog_id]
