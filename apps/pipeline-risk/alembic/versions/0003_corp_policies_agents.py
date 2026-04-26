"""corp knowledge, policies CRUD, agents reports

Revision ID: 0003_corp_policies_agents
Revises: 0002_risk_schema
Create Date: 2026-04-26
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from pgvector.sqlalchemy import Vector
from sqlalchemy.dialects import postgresql

revision = "0003_corp_policies_agents"
down_revision = "0002_risk_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Corporate knowledge sources (Drive / GitHub / Notion / Slack / Upload)
    op.create_table(
        "corp_sources",
        sa.Column("source_id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), nullable=False, server_default="default"),
        sa.Column("kind", sa.String(32), nullable=False),  # drive|github|notion|slack|upload
        sa.Column("name", sa.Text, nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="connected"),
        sa.Column("config", postgresql.JSONB, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_corp_sources_tenant", "corp_sources", ["tenant_id"])

    # ── Corp documents (one row per ingested document)
    op.create_table(
        "corp_documents",
        sa.Column("document_id", sa.String(64), primary_key=True),
        sa.Column("source_id", sa.String(64), sa.ForeignKey("corp_sources.source_id", ondelete="CASCADE"), nullable=False),
        sa.Column("tenant_id", sa.String(64), nullable=False, server_default="default"),
        sa.Column("title", sa.Text, nullable=False),
        sa.Column("uri", sa.Text),
        sa.Column("mime_type", sa.String(128)),
        sa.Column("byte_size", sa.BigInteger),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_corp_documents_source", "corp_documents", ["source_id"])
    op.create_index("ix_corp_documents_tenant", "corp_documents", ["tenant_id"])

    # ── Corp chunks (separate from regulation/standard risk_chunks for clean tenancy)
    op.create_table(
        "corp_chunks",
        sa.Column("chunk_id", sa.String(64), primary_key=True),
        sa.Column("document_id", sa.String(64), sa.ForeignKey("corp_documents.document_id", ondelete="CASCADE"), nullable=False),
        sa.Column("tenant_id", sa.String(64), nullable=False, server_default="default"),
        sa.Column("ord", sa.Integer, nullable=False),
        sa.Column("text", sa.Text, nullable=False),
        sa.Column("token_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("embedding", Vector(768)),
        sa.Column("indexed_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_corp_chunks_document", "corp_chunks", ["document_id"])
    op.create_index("ix_corp_chunks_tenant", "corp_chunks", ["tenant_id"])

    # ── Regulation supplementary uploads (PDF user-attached)
    op.create_table(
        "regulation_uploads",
        sa.Column("upload_id", sa.String(64), primary_key=True),
        sa.Column("regulation_id", sa.String(64), sa.ForeignKey("regulations.regulation_id", ondelete="CASCADE"), nullable=False),
        sa.Column("tenant_id", sa.String(64), nullable=False, server_default="default"),
        sa.Column("title", sa.Text, nullable=False),
        sa.Column("mime_type", sa.String(128)),
        sa.Column("byte_size", sa.BigInteger),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_regulation_uploads_reg", "regulation_uploads", ["regulation_id"])

    # ── Tenant policies (CRUD-able)
    op.create_table(
        "tenant_policies",
        sa.Column("policy_id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), nullable=False, server_default="default"),
        sa.Column("label", sa.Text, nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("parent_id", sa.String(64)),
        sa.Column("enabled", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("mandatory", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("risk_categories", postgresql.JSONB, server_default="[]"),
        sa.Column("mapped_obligations", postgresql.JSONB, server_default="[]"),
        sa.Column("assigned_agents", postgresql.JSONB, server_default="[]"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_tenant_policies_tenant", "tenant_policies", ["tenant_id"])

    # ── Registered agents (from GitHub repo)
    op.create_table(
        "agent_registrations",
        sa.Column("agent_id", sa.String(64), primary_key=True),
        sa.Column("tenant_id", sa.String(64), nullable=False, server_default="default"),
        sa.Column("name", sa.Text, nullable=False),
        sa.Column("repo_url", sa.Text, nullable=False),
        sa.Column("path", sa.Text),
        sa.Column("description", sa.Text),
        sa.Column("status", sa.String(32), nullable=False, server_default="registered"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_agent_registrations_tenant", "agent_registrations", ["tenant_id"])

    # ── Agent analyses (Gemini-generated reports + certifications)
    op.create_table(
        "agent_analyses",
        sa.Column("analysis_id", sa.String(64), primary_key=True),
        sa.Column("agent_id", sa.String(64), sa.ForeignKey("agent_registrations.agent_id", ondelete="CASCADE"), nullable=False),
        sa.Column("tenant_id", sa.String(64), nullable=False, server_default="default"),
        sa.Column("trust_score", sa.Integer, nullable=False, server_default="0"),
        sa.Column("grade", sa.String(2)),
        sa.Column("risk_class", sa.String(32)),  # high|limited|minimal
        sa.Column("findings", postgresql.JSONB, server_default="[]"),
        sa.Column("matched_obligations", postgresql.JSONB, server_default="[]"),
        sa.Column("matched_policies", postgresql.JSONB, server_default="[]"),
        sa.Column("insurance_eligible", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("certificate_url", sa.Text),
        sa.Column("report_md", sa.Text),
        sa.Column("model", sa.String(64)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_agent_analyses_agent", "agent_analyses", ["agent_id"])


def downgrade() -> None:
    op.drop_index("ix_agent_analyses_agent", table_name="agent_analyses")
    op.drop_table("agent_analyses")
    op.drop_index("ix_agent_registrations_tenant", table_name="agent_registrations")
    op.drop_table("agent_registrations")
    op.drop_index("ix_tenant_policies_tenant", table_name="tenant_policies")
    op.drop_table("tenant_policies")
    op.drop_index("ix_regulation_uploads_reg", table_name="regulation_uploads")
    op.drop_table("regulation_uploads")
    op.drop_index("ix_corp_chunks_tenant", table_name="corp_chunks")
    op.drop_index("ix_corp_chunks_document", table_name="corp_chunks")
    op.drop_table("corp_chunks")
    op.drop_index("ix_corp_documents_tenant", table_name="corp_documents")
    op.drop_index("ix_corp_documents_source", table_name="corp_documents")
    op.drop_table("corp_documents")
    op.drop_index("ix_corp_sources_tenant", table_name="corp_sources")
    op.drop_table("corp_sources")
