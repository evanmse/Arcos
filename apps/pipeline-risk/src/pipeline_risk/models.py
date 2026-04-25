"""Pydantic models shared across the INTEGREAT risk pipeline."""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


Language = Literal["en", "fr"]


class SourceType(str, Enum):
    REGULATION = "regulation"
    STANDARD = "standard"
    INSURANCE = "insurance"


class RiskDimension(str, Enum):
    TECHNICAL = "technical"
    LEGAL = "legal"
    ETHICAL_SOCIAL = "ethical_social"
    FINANCIAL = "financial"
    ECONOMIC = "economic"


class RiskCategory(str, Enum):
    ICT_RISK = "ict_risk"
    AI_GOVERNANCE = "ai_governance"
    BIAS = "bias"
    TRANSPARENCY = "transparency"
    HUMAN_OVERSIGHT = "human_oversight"
    DATA_PROTECTION = "data_protection"
    THIRD_PARTY = "third_party"
    INCIDENT = "incident"
    AUDIT = "audit"
    SECURITY = "security"
    PROMPT_INJECTION = "prompt_injection"
    JAILBREAK = "jailbreak"
    HALLUCINATION = "hallucination"
    ETHICAL_SOCIAL = "ethical_social"


class Regulation(BaseModel):
    """A regulatory text (e.g. DORA Regulation 2022/2554)."""

    regulation_id: str = Field(description="Stable slug, e.g. 'dora', 'mica', 'ai_act', 'rgpd'")
    celex: str
    title: str
    short_name: str
    publication_date: str | None = None
    source_url: str | None = None
    lang: Language = "en"
    domain: str | None = None


class Standard(BaseModel):
    standard_id: str
    title: str
    version: str | None = None


class StandardSection(BaseModel):
    standard_id: str
    section_id: str
    title: str
    chapter: str | None = None
    text: str


class InsuranceCatalog(BaseModel):
    catalog_id: str
    name: str
    partner: str | None = None


class InsuranceClause(BaseModel):
    catalog_id: str
    clause_id: str
    clause_type: Literal["coverage", "exclusion", "condition", "deductible", "limit"]
    title: str
    text: str
    applicable_risk_categories: list[RiskCategory] = Field(default_factory=list)
    min_trust_score: float | None = None


class Article(BaseModel):
    regulation_id: str
    article_number: str
    title: str | None = None
    chapter: str | None = None
    text: str
    citations: list[str] = Field(default_factory=list)


class Chunk(BaseModel):
    """A semantically coherent chunk produced by the chunker."""

    chunk_id: str
    regulation_id: str
    article_number: str
    paragraph_number: str | None = None
    chapter: str | None = None
    text: str
    token_count: int
    lang: Language = "en"
    source_url: str | None = None
    source_type: SourceType = SourceType.REGULATION
    source_id: str | None = None  # ai_act | iso_42001 | munichre | ...


class EmbeddedChunk(Chunk):
    embedding: list[float]


class Obligation(BaseModel):
    """Legacy/alias atomic obligation. Kept for back-compat with the LLM extractor."""

    id: str
    regulation_id: str
    article_number: str
    text: str
    applicable_to: list[str] = Field(default_factory=list)
    sanction: str | None = None
    deadline: str | None = None
    domain: list[str] = Field(default_factory=list)
    risk_categories: list[RiskCategory] = Field(default_factory=list)
    dimension: RiskDimension | None = None


class RiskObligation(BaseModel):
    """Generalised obligation across regulation / standard / insurance."""

    obligation_id: str
    source_type: SourceType
    source_id: str
    ref: str
    text: str
    sanction_max: str | None = None
    deadline: str | None = None
    applicable_to: list[str] = Field(default_factory=list)
    risk_categories: list[RiskCategory] = Field(default_factory=list)
    dimension: RiskDimension
    domain: str | None = None


class ObligationExtractionResult(BaseModel):
    """Strict JSON schema returned by the Gemini extractor."""

    obligations: list[Obligation]


class CrawlResult(BaseModel):
    celex: str
    fetched_at: datetime
    storage_uri: str
    sha256: str
    bytes: int
