"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-04-25
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from pgvector.sqlalchemy import Vector

# revision identifiers
revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    op.create_table(
        "regulations",
        sa.Column("regulation_id", sa.String(64), primary_key=True),
        sa.Column("celex", sa.String(32), nullable=False, unique=True),
        sa.Column("title", sa.Text, nullable=False),
        sa.Column("short_name", sa.String(64), nullable=False),
        sa.Column("publication_date", sa.String(16)),
        sa.Column("source_url", sa.Text),
        sa.Column("lang", sa.String(8), server_default="en"),
    )

    op.create_table(
        "legal_chunks",
        sa.Column("chunk_id", sa.String(64), primary_key=True),
        sa.Column(
            "regulation_id",
            sa.String(64),
            sa.ForeignKey("regulations.regulation_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("article_number", sa.String(16), nullable=False),
        sa.Column("paragraph_number", sa.String(16)),
        sa.Column("chapter", sa.Text),
        sa.Column("text", sa.Text, nullable=False),
        sa.Column("token_count", sa.Integer, nullable=False),
        sa.Column("lang", sa.String(8), server_default="en"),
        sa.Column("source_url", sa.Text),
        sa.Column("embedding", Vector(768)),
        sa.Column(
            "indexed_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_legal_chunks_reg_article",
        "legal_chunks",
        ["regulation_id", "article_number"],
    )

    op.create_table(
        "legal_obligations",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column(
            "regulation_id",
            sa.String(64),
            sa.ForeignKey("regulations.regulation_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("article_number", sa.String(16), nullable=False),
        sa.Column("text", sa.Text, nullable=False),
        sa.Column("applicable_to", sa.JSON, server_default="[]"),
        sa.Column("sanction", sa.Text),
        sa.Column("deadline", sa.String(64)),
        sa.Column("domain", sa.JSON, server_default="[]"),
        sa.Column("embedding_id", sa.String(64)),
        sa.Column(
            "extracted_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_legal_obligations_reg_article",
        "legal_obligations",
        ["regulation_id", "article_number"],
    )


def downgrade() -> None:
    op.drop_index("ix_legal_obligations_reg_article", table_name="legal_obligations")
    op.drop_table("legal_obligations")
    op.drop_index("ix_legal_chunks_reg_article", table_name="legal_chunks")
    op.drop_table("legal_chunks")
    op.drop_table("regulations")
