"""risk schema (rename legal_* -> risk_*, add standards/insurance)

Revision ID: 0002_risk_schema
Revises: 0001_initial
Create Date: 2026-04-25
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from pgvector.sqlalchemy import Vector

revision = "0002_risk_schema"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1) Standards
    op.create_table(
        "standards",
        sa.Column("standard_id", sa.String(64), primary_key=True),
        sa.Column("title", sa.Text, nullable=False),
        sa.Column("version", sa.String(32)),
    )

    # 2) Insurance catalogs + clauses
    op.create_table(
        "insurance_catalogs",
        sa.Column("catalog_id", sa.String(64), primary_key=True),
        sa.Column("name", sa.Text, nullable=False),
        sa.Column("partner", sa.String(128)),
    )
    op.create_table(
        "insurance_clauses",
        sa.Column("clause_id", sa.String(64), primary_key=True),
        sa.Column(
            "catalog_id",
            sa.String(64),
            sa.ForeignKey("insurance_catalogs.catalog_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("clause_type", sa.String(16), nullable=False),
        sa.Column("title", sa.Text, nullable=False),
        sa.Column("text", sa.Text, nullable=False),
        sa.Column("applicable_risk_categories", sa.JSON, server_default="[]"),
        sa.Column("min_trust_score", sa.Float),
        sa.Column("embedding", Vector(768)),
        sa.Column(
            "indexed_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # 3) legal_chunks -> risk_chunks (+ source_type/source_id)
    op.drop_index("ix_legal_chunks_reg_article", table_name="legal_chunks")
    op.rename_table("legal_chunks", "risk_chunks")
    op.add_column(
        "risk_chunks",
        sa.Column("source_type", sa.String(16), server_default="regulation", nullable=False),
    )
    op.add_column(
        "risk_chunks",
        sa.Column("source_id", sa.String(64), nullable=True),
    )
    op.execute("UPDATE risk_chunks SET source_id = regulation_id WHERE source_id IS NULL")
    op.alter_column("risk_chunks", "source_id", nullable=False)
    op.alter_column("risk_chunks", "regulation_id", nullable=True)
    op.alter_column("risk_chunks", "article_number", type_=sa.String(32))
    op.create_index(
        "ix_risk_chunks_source",
        "risk_chunks",
        ["source_type", "source_id", "article_number"],
    )

    # 4) legal_obligations -> risk_obligations
    op.drop_index("ix_legal_obligations_reg_article", table_name="legal_obligations")
    op.rename_table("legal_obligations", "risk_obligations")
    op.add_column(
        "risk_obligations",
        sa.Column("source_type", sa.String(16), server_default="regulation", nullable=False),
    )
    op.add_column(
        "risk_obligations",
        sa.Column("source_id", sa.String(64), nullable=True),
    )
    op.add_column(
        "risk_obligations",
        sa.Column("risk_categories", sa.JSON, server_default="[]"),
    )
    op.add_column(
        "risk_obligations",
        sa.Column("dimension", sa.String(32)),
    )
    op.execute("UPDATE risk_obligations SET source_id = regulation_id WHERE source_id IS NULL")
    op.alter_column("risk_obligations", "source_id", nullable=False)
    op.alter_column("risk_obligations", "regulation_id", nullable=True)
    op.alter_column("risk_obligations", "article_number", type_=sa.String(32))
    op.create_index(
        "ix_risk_obligations_source",
        "risk_obligations",
        ["source_type", "source_id", "article_number"],
    )


def downgrade() -> None:
    op.drop_index("ix_risk_obligations_source", table_name="risk_obligations")
    op.drop_column("risk_obligations", "dimension")
    op.drop_column("risk_obligations", "risk_categories")
    op.drop_column("risk_obligations", "source_id")
    op.drop_column("risk_obligations", "source_type")
    op.alter_column("risk_obligations", "regulation_id", nullable=False)
    op.rename_table("risk_obligations", "legal_obligations")
    op.create_index(
        "ix_legal_obligations_reg_article",
        "legal_obligations",
        ["regulation_id", "article_number"],
    )

    op.drop_index("ix_risk_chunks_source", table_name="risk_chunks")
    op.drop_column("risk_chunks", "source_id")
    op.drop_column("risk_chunks", "source_type")
    op.alter_column("risk_chunks", "regulation_id", nullable=False)
    op.rename_table("risk_chunks", "legal_chunks")
    op.create_index(
        "ix_legal_chunks_reg_article",
        "legal_chunks",
        ["regulation_id", "article_number"],
    )

    op.drop_table("insurance_clauses")
    op.drop_table("insurance_catalogs")
    op.drop_table("standards")
