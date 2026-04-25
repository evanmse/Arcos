"""SQLAlchemy table for policies tree."""
from __future__ import annotations

from sqlalchemy import JSON, Boolean, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class PolicyRow(Base):
    __tablename__ = "policies_tree"

    # Composite PK = (tenant_id, id) — but we store tenant_id as part of a
    # composite text PK to keep portability with sqlite (used in tests).
    pk: Mapped[str] = mapped_column(String(256), primary_key=True)
    tenant_id: Mapped[str | None] = mapped_column(String(64), index=True)
    id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    label: Mapped[str] = mapped_column(Text, nullable=False)
    parent_id: Mapped[str | None] = mapped_column(String(128))
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    mandatory: Mapped[bool] = mapped_column(Boolean, default=False)
    mapped_obligations: Mapped[list[str]] = mapped_column(JSON, default=list)
    risk_categories: Mapped[list[str]] = mapped_column(JSON, default=list)
    description: Mapped[str | None] = mapped_column(Text)


def make_pk(tenant_id: str | None, policy_id: str) -> str:
    return f"{tenant_id or '__global__'}::{policy_id}"
