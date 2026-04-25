"""DB engine factory."""
from __future__ import annotations

from functools import lru_cache

from sqlalchemy import Engine, create_engine

from pipeline_risk.settings import Settings


@lru_cache(maxsize=4)
def get_engine(dsn: str) -> Engine:
    return create_engine(dsn, pool_pre_ping=True, future=True)


def engine_from_settings(settings: Settings) -> Engine:
    return get_engine(settings.pg_dsn)
