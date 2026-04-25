"""SQLAlchemy schema for the INTEGREAT risk pipeline."""
from __future__ import annotations

from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    JSON,
    DateTime,
    Float,
    ForeignKey,
    Index,
    String,
    Text,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Regulation(Base):
    __tablename__ = "regulations"

    regulation_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    celex: Mapped[str] = mapped_column(String(32), nullable=False, unique=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    short_name: Mapped[str] = mapped_column(String(64), nullable=False)
    publication_date: Mapped[str | None] = mapped_column(String(16))
    source_url: Mapped[str | None] = mapped_column(Text)
    lang: Mapped[str] = mapped_column(String(8), default="en")


class Standard(Base):
    __tablename__ = "standards"

    standard_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    version: Mapped[str | None] = mapped_column(String(32))


class InsuranceCatalog(Base):
    __tablename__ = "insurance_catalogs"

    catalog_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    partner: Mapped[str | None] = mapped_column(String(128))

    clauses: Mapped[list["InsuranceClauseRow"]] = relationship(back_populates="catalog")


class RiskChunk(Base):
    __tablename__ = "risk_chunks"

    chunk_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    source_type: Mapped[str] = mapped_column(String(16), nullable=False, default="regulation")
    source_id: Mapped[str] = mapped_column(String(64), nullable=False)
    regulation_id: Mapped[str | None] = mapped_column(String(64))
    article_number: Mapped[str] = mapped_column(String(32), nullable=False)
    paragraph_number: Mapped[str | None] = mapped_column(String(16))
    chapter: Mapped[str | None] = mapped_column(Text)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    token_count: Mapped[int] = mapped_column(nullable=False)
    lang: Mapped[str] = mapped_column(String(8), default="en")
    source_url: Mapped[str | None] = mapped_column(Text)
    embedding: Mapped[list[float] | None] = mapped_column(Vector(768))
    indexed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        Index("ix_risk_chunks_source", "source_type", "source_id", "article_number"),
    )


class RiskObligation(Base):
    __tablename__ = "risk_obligations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    source_type: Mapped[str] = mapped_column(String(16), nullable=False, default="regulation")
    source_id: Mapped[str] = mapped_column(String(64), nullable=False)
    regulation_id: Mapped[str | None] = mapped_column(String(64))
    article_number: Mapped[str] = mapped_column(String(32), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    applicable_to: Mapped[list[str]] = mapped_column(JSON, default=list)
    risk_categories: Mapped[list[str]] = mapped_column(JSON, default=list)
    dimension: Mapped[str | None] = mapped_column(String(32))
    sanction: Mapped[str | None] = mapped_column(Text)
    deadline: Mapped[str | None] = mapped_column(String(64))
    domain: Mapped[list[str]] = mapped_column(JSON, default=list)
    embedding_id: Mapped[str | None] = mapped_column(String(64))
    extracted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        Index("ix_risk_obligations_source", "source_type", "source_id", "article_number"),
    )


class InsuranceClauseRow(Base):
    __tablename__ = "insurance_clauses"

    clause_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    catalog_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("insurance_catalogs.catalog_id", ondelete="CASCADE"), nullable=False
    )
    clause_type: Mapped[str] = mapped_column(String(16), nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    applicable_risk_categories: Mapped[list[str]] = mapped_column(JSON, default=list)
    min_trust_score: Mapped[float | None] = mapped_column(Float)
    embedding: Mapped[list[float] | None] = mapped_column(Vector(768))
    indexed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    catalog: Mapped[InsuranceCatalog] = relationship(back_populates="clauses")


# --- Backwards-compat aliases (keep imports stable for older callers) ---
LegalChunk = RiskChunk
LegalObligation = RiskObligation
