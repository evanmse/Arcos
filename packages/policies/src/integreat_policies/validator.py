"""Validation helpers for the Policies Tree."""
from __future__ import annotations

from collections.abc import Iterable

from integreat_policies.models import Policy


class UnknownParentError(ValueError):
    """Raised when a policy declares a parent_id that does not exist."""


class MandatoryPolicyDisabledError(ValueError):
    """Raised when a mandatory policy is disabled."""


def validate_dependencies(policies: Iterable[Policy]) -> None:
    """Ensure every parent_id is defined among the supplied policies."""
    policies = list(policies)
    ids = {p.id for p in policies}
    missing: list[tuple[str, str]] = []
    for p in policies:
        if p.parent_id and p.parent_id not in ids:
            missing.append((p.id, p.parent_id))
    if missing:
        details = ", ".join(f"{c}->{pa}" for c, pa in missing)
        raise UnknownParentError(f"Unknown parent_id(s): {details}")


def check_mandatory_enabled(policies: Iterable[Policy]) -> None:
    """Raise if a mandatory policy is disabled."""
    disabled = [p.id for p in policies if p.mandatory and not p.enabled]
    if disabled:
        raise MandatoryPolicyDisabledError(
            "Mandatory policies disabled: " + ", ".join(disabled)
        )
