"""Tests for PoliciesStore (sqlite in-memory + fakeredis)."""
from __future__ import annotations

import fakeredis
import pytest
from sqlalchemy import create_engine

from integreat_policies.models import Policy
from integreat_policies.seed import POLICIES_SEED
from integreat_policies.store import PoliciesStore
from integreat_policies.validator import MandatoryPolicyDisabledError


@pytest.fixture
def store() -> PoliciesStore:
    engine = create_engine("sqlite:///:memory:")
    redis = fakeredis.FakeRedis()
    s = PoliciesStore(engine=engine, redis=redis)
    s.init_schema()
    return s


def test_seed_for_tenant_inserts_all_policies(store: PoliciesStore) -> None:
    n = store.seed_for_tenant("acme")
    assert n == len(POLICIES_SEED)
    tree = store.get_tree("acme")
    assert len(tree) == len(POLICIES_SEED)
    assert all(p.tenant_id == "acme" for p in tree)


def test_get_tree_uses_cache_after_first_read(store: PoliciesStore) -> None:
    store.seed_for_tenant("acme")
    first = store.get_tree("acme")
    second = store.get_tree("acme")
    assert {p.id for p in first} == {p.id for p in second}


def test_toggle_disables_optional_policy(store: PoliciesStore) -> None:
    store.seed_for_tenant("acme")
    p = store.toggle("acme", "ai_act.high_risk.credit_scoring", enabled=False)
    assert p.enabled is False
    tree = store.get_tree("acme")
    target = next(x for x in tree if x.id == "ai_act.high_risk.credit_scoring")
    assert target.enabled is False


def test_toggle_rejects_mandatory_disable(store: PoliciesStore) -> None:
    store.seed_for_tenant("acme")
    with pytest.raises(MandatoryPolicyDisabledError):
        store.toggle("acme", "ai_act.applicability", enabled=False)


def test_toggle_unknown_policy_raises(store: PoliciesStore) -> None:
    store.seed_for_tenant("acme")
    with pytest.raises(KeyError):
        store.toggle("acme", "ghost.policy", enabled=True)


def test_upsert_validates_unknown_parent(store: PoliciesStore) -> None:
    from integreat_policies.validator import UnknownParentError

    bad = [Policy(id="orphan", label="orphan", parent_id="ghost")]
    with pytest.raises(UnknownParentError):
        store.upsert("acme", bad)


def test_get_enabled_obligations_aggregates_across_tree(store: PoliciesStore) -> None:
    custom = [
        Policy(id="root", label="root", mandatory=True, mapped_obligations=["o1"]),
        Policy(id="leaf", label="leaf", parent_id="root", mapped_obligations=["o2", "o3"]),
        Policy(id="off",  label="off",  parent_id="root", enabled=False, mapped_obligations=["o4"]),
    ]
    store.upsert("acme", custom)
    obligations = store.get_enabled_obligations("acme")
    assert set(obligations) == {"o1", "o2", "o3"}
