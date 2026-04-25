"""Insurance catalog loader."""
from __future__ import annotations

import json
from pathlib import Path

from pipeline_risk.models import InsuranceClause


def load_insurance_catalog(catalog_id: str, data_dir: Path) -> list[InsuranceClause]:
    path = Path(data_dir) / "insurance" / f"{catalog_id}_terms.json"
    if not path.exists():
        raise FileNotFoundError(f"Insurance catalog not found: {path}")
    raw = json.loads(path.read_text(encoding="utf-8"))
    return [
        InsuranceClause(
            catalog_id=catalog_id,
            clause_id=item["clause_id"],
            clause_type=item["clause_type"],
            title=item["title"],
            text=item["text"],
            applicable_risk_categories=item.get("applicable_risk_categories", []),
            min_trust_score=item.get("min_trust_score"),
        )
        for item in raw
    ]
