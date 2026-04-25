"""Pydantic models shared across the pipeline."""
from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


Language = Literal["en", "fr"]


class Regulation(BaseModel):
    """A regulatory text (e.g. DORA Regulation 2022/2554)."""

    regulation_id: str = Field(description="Stable slug, e.g. 'dora', 'mica', 'ai_act', 'rgpd'")
    celex: str
    title: str
    short_name: str
    publication_date: str | None = None
    source_url: str | None = None
    lang: Language = "en"


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


class EmbeddedChunk(Chunk):
    embedding: list[float]


class Obligation(BaseModel):
    """A normative atom extracted by the LLM."""

    id: str
    regulation_id: str
    article_number: str
    text: str
    applicable_to: list[str] = Field(default_factory=list)
    sanction: str | None = None
    deadline: str | None = None
    domain: list[str] = Field(default_factory=list)


class ObligationExtractionResult(BaseModel):
    """Strict JSON schema returned by the Gemini extractor."""

    obligations: list[Obligation]


class CrawlResult(BaseModel):
    celex: str
    fetched_at: datetime
    storage_uri: str
    sha256: str
    bytes: int
