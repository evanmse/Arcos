"""Postgres-backed PoliciesStore with Redis cache."""
from __future__ import annotations

import json
from typing import TYPE_CHECKING

from sqlalchemy.orm import Session

from integreat_policies.db import Base, PolicyRow, make_pk
from integreat_policies.models import Policy
from integreat_policies.seed import list_seed_policies
from integreat_policies.validator import (
    MandatoryPolicyDisabledError,
    check_mandatory_enabled,
    validate_dependencies,
)

if TYPE_CHECKING:
    from redis import Redis
    from sqlalchemy.engine import Engine


CACHE_KEY = "integreat:policies:{tenant_id}"
CACHE_TTL_SECONDS = 300


class PoliciesStore:
    """CRUD facade with cache invalidation on mutating ops."""

    def __init__(self, *, engine: "Engine", redis: "Redis | None" = None) -> None:
        self._engine = engine
        self._redis = redis

    # --- DDL --------------------------------------------------------------
    def init_schema(self) -> None:
        Base.metadata.create_all(self._engine)

    # --- public API -------------------------------------------------------
    def seed_for_tenant(self, tenant_id: str) -> int:
        policies = list_seed_policies(tenant_id=tenant_id)
        return self.upsert(tenant_id, policies)

    def upsert(self, tenant_id: str | None, policies: list[Policy]) -> int:
        validate_dependencies(policies)
        with Session(self._engine) as s:
            for p in policies:
                pk = make_pk(tenant_id, p.id)
                row = s.get(PolicyRow, pk)
                payload = p.model_copy(update={"tenant_id": tenant_id})
                if row is None:
                    s.add(
                        PolicyRow(
                            pk=pk,
                            tenant_id=tenant_id,
                            id=payload.id,
                            label=payload.label,
                            parent_id=payload.parent_id,
                            enabled=payload.enabled,
                            mandatory=payload.mandatory,
                            mapped_obligations=list(payload.mapped_obligations),
                            risk_categories=list(payload.risk_categories),
                            description=payload.description,
                        )
                    )
                else:
                    row.label = payload.label
                    row.parent_id = payload.parent_id
                    row.enabled = payload.enabled
                    row.mandatory = payload.mandatory
                    row.mapped_obligations = list(payload.mapped_obligations)
                    row.risk_categories = list(payload.risk_categories)
                    row.description = payload.description
            s.commit()
        self._invalidate(tenant_id)
        return len(policies)

    def get_tree(self, tenant_id: str | None) -> list[Policy]:
        cached = self._cache_get(tenant_id)
        if cached is not None:
            return cached
        with Session(self._engine) as s:
            rows = (
                s.query(PolicyRow)
                .filter(PolicyRow.tenant_id == tenant_id)
                .order_by(PolicyRow.id)
                .all()
            )
        policies = [
            Policy(
                id=r.id,
                label=r.label,
                parent_id=r.parent_id,
                enabled=r.enabled,
                mandatory=r.mandatory,
                mapped_obligations=list(r.mapped_obligations or []),
                risk_categories=list(r.risk_categories or []),
                description=r.description,
                tenant_id=r.tenant_id,
            )
            for r in rows
        ]
        self._cache_set(tenant_id, policies)
        return policies

    def toggle(self, tenant_id: str | None, policy_id: str, enabled: bool) -> Policy:
        pk = make_pk(tenant_id, policy_id)
        with Session(self._engine) as s:
            row = s.get(PolicyRow, pk)
            if row is None:
                raise KeyError(f"Policy not found: {policy_id} (tenant={tenant_id})")
            if row.mandatory and not enabled:
                raise MandatoryPolicyDisabledError(
                    f"Cannot disable mandatory policy: {policy_id}"
                )
            row.enabled = enabled
            s.commit()
            policy = Policy(
                id=row.id,
                label=row.label,
                parent_id=row.parent_id,
                enabled=row.enabled,
                mandatory=row.mandatory,
                mapped_obligations=list(row.mapped_obligations or []),
                risk_categories=list(row.risk_categories or []),
                description=row.description,
                tenant_id=row.tenant_id,
            )
        self._invalidate(tenant_id)
        return policy

    def get_enabled_obligations(self, tenant_id: str | None) -> list[str]:
        tree = self.get_tree(tenant_id)
        check_mandatory_enabled(tree)
        out: list[str] = []
        for p in tree:
            if p.enabled:
                out.extend(p.mapped_obligations)
        return out

    # --- cache helpers ----------------------------------------------------
    def _cache_key(self, tenant_id: str | None) -> str:
        return CACHE_KEY.format(tenant_id=tenant_id or "__global__")

    def _cache_get(self, tenant_id: str | None) -> list[Policy] | None:
        if self._redis is None:
            return None
        try:
            raw = self._redis.get(self._cache_key(tenant_id))
        except Exception:  # noqa: BLE001
            return None
        if not raw:
            return None
        if isinstance(raw, bytes):
            raw = raw.decode("utf-8")
        try:
            data = json.loads(raw)
        except (TypeError, ValueError):
            return None
        return [Policy.model_validate(p) for p in data]

    def _cache_set(self, tenant_id: str | None, policies: list[Policy]) -> None:
        if self._redis is None:
            return
        try:
            self._redis.setex(
                self._cache_key(tenant_id),
                CACHE_TTL_SECONDS,
                json.dumps([p.model_dump() for p in policies]),
            )
        except Exception:  # noqa: BLE001
            pass

    def _invalidate(self, tenant_id: str | None) -> None:
        if self._redis is None:
            return
        try:
            self._redis.delete(self._cache_key(tenant_id))
        except Exception:  # noqa: BLE001
            pass
