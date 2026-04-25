"""Standards loader (ISO 42001, ISO 23894, NIST AI RMF, OWASP LLM Top 10).

Reads the local JSON catalogues under ``data/standards/`` and returns
validated Pydantic ``StandardSection`` instances.
"""
from __future__ import annotations

import json
from pathlib import Path

from pipeline_risk.models import StandardSection


def load_standard(standard_id: str, data_dir: Path) -> list[StandardSection]:
    path = Path(data_dir) / "standards" / f"{standard_id}.json"
    if not path.exists():
        raise FileNotFoundError(f"Standard catalogue not found: {path}")
    raw = json.loads(path.read_text(encoding="utf-8"))
    return [
        StandardSection(
            standard_id=standard_id,
            section_id=item["section_id"],
            title=item["title"],
            chapter=item.get("chapter"),
            text=item["text"],
        )
        for item in raw
    ]
