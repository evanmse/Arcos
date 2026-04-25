"""SQLAlchemy schema for the legal pipeline."""
from __future__ import annotations

from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    JSON,
    DateTime,
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

    chunks: Mapped[list["LegalChunk"]] = relationship(back_populates="regulation")
    obligations: Mapped[list["LegalObligation"]] = relationship(back_populates="regulation")


class LegalChunk(Base):
    __tablename__ = "legal_chunks"

    chunk_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    regulation_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("regulations.regulation_id", ondelete="CASCADE"), nullable=False
    )
    article_number: Mapped[str] = mapped_column(String(16), nullable=False)
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

    regulation: Mapped[Regulation] = relationship(back_populates="chunks")

    __table_args__ = (
        Index("ix_legal_chunks_reg_article", "regulation_id", "article_number"),
    )


class LegalObligation(Base):
    __tablename__ = "legal_obligations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    regulation_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("regulations.regulation_id", ondelete="CASCADE"), nullable=False
    )
    article_number: Mapped[str] = mapped_column(String(16), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    applicable_to: Mapped[list[str]] = mapped_column(JSON, default=list)
    sanction: Mapped[str | None] = mapped_column(Text)
    deadline: Mapped[str | None] = mapped_column(String(64))
    domain: Mapped[list[str]] = mapped_column(JSON, default=list)
    embedding_id: Mapped[str | None] = mapped_column(String(64))
    extracted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    regulation: Mapped[Regulation] = relationship(back_populates="obligations")

    __table_args__ = (
        Index("ix_legal_obligations_reg_article", "regulation_id", "article_number"),
    )
