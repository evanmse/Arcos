"""Pytest fixtures."""
from __future__ import annotations

import pytest

from pipeline_risk.settings import Settings, get_settings


@pytest.fixture(autouse=True)
def reset_settings_cache():
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def settings() -> Settings:
    return Settings(env="test", gcp_project_id="integreat-test", raw_legal_bucket="integreat-test-raw")
