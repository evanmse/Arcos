"""Pydantic models for INTEGREAT Policies Tree."""
from __future__ import annotations

from pydantic import BaseModel, Field


class Policy(BaseModel):
    id: str
    label: str
    parent_id: str | None = None
    enabled: bool = True
    mandatory: bool = False
    mapped_obligations: list[str] = Field(default_factory=list)
    risk_categories: list[str] = Field(default_factory=list)
    description: str | None = None
    tenant_id: str | None = None
