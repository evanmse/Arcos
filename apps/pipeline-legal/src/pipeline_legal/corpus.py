"""Initial regulation catalogue (CELEX → Regulation metadata)."""
from __future__ import annotations

from pipeline_legal.models import Regulation

CORPUS: dict[str, Regulation] = {
    "dora": Regulation(
        regulation_id="dora",
        celex="32022R2554",
        title="Regulation (EU) 2022/2554 on digital operational resilience for the financial sector (DORA)",
        short_name="DORA",
        publication_date="2022-12-27",
    ),
    "mica": Regulation(
        regulation_id="mica",
        celex="32023R1114",
        title="Regulation (EU) 2023/1114 on markets in crypto-assets (MiCA)",
        short_name="MiCA",
        publication_date="2023-06-09",
    ),
    "ai_act": Regulation(
        regulation_id="ai_act",
        celex="32024R1689",
        title="Regulation (EU) 2024/1689 laying down harmonised rules on artificial intelligence (AI Act)",
        short_name="AI Act",
        publication_date="2024-07-12",
    ),
    "rgpd": Regulation(
        regulation_id="rgpd",
        celex="32016R0679",
        title="Regulation (EU) 2016/679 — General Data Protection Regulation (GDPR)",
        short_name="GDPR",
        publication_date="2016-04-27",
    ),
}


def list_regulations() -> list[Regulation]:
    return list(CORPUS.values())


def get_regulation(regulation_id: str) -> Regulation:
    return CORPUS[regulation_id]
