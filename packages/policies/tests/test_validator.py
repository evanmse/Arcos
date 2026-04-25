"""Tests for the policies validator."""
from __future__ import annotations

import pytest

from integreat_policies.models import Policy
from integreat_policies.validator import (
    MandatoryPolicyDisabledError,
    UnknownParentError,
    check_mandatory_enabled,
    validate_dependencies,
)


def test_validate_dependencies_passes_on_valid_tree() -> None:
    policies = [
        Policy(id="root", label="root"),
        Policy(id="child", label="child", parent_id="root"),
    ]
    validate_dependencies(policies)


def test_validate_dependencies_rejects_unknown_parent() -> None:
    policies = [
        Policy(id="orphan", label="orphan", parent_id="ghost"),
    ]
    with pytest.raises(UnknownParentError):
        validate_dependencies(policies)


def test_check_mandatory_passes_when_enabled() -> None:
    policies = [Policy(id="m", label="m", mandatory=True, enabled=True)]
    check_mandatory_enabled(policies)


def test_check_mandatory_raises_when_disabled() -> None:
    policies = [Policy(id="m", label="m", mandatory=True, enabled=False)]
    with pytest.raises(MandatoryPolicyDisabledError):
        check_mandatory_enabled(policies)
