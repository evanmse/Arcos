"""Centralized settings for the INTEGREAT risk pipeline."""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="INTEGREAT_", env_file=".env", extra="ignore")

    env: Literal["dev", "prod", "test"] = "dev"
    gcp_project_id: str = "integreat-dev"
    gcp_region: str = "europe-west1"

    # Storage
    raw_legal_bucket: str = "integreat-dev-raw-legal"
    raw_risk_bucket: str = "integreat-dev-raw-risk"

    # Local data directories (standards + insurance JSON catalogs)
    data_dir: Path = Path(__file__).resolve().parent.parent.parent / "data"

    # Postgres
    pg_host: str = "127.0.0.1"
    pg_port: int = 5432
    pg_database: str = "integreat"
    pg_user: str = "integreat_app"
    pg_password: str = "integreat_app"

    @property
    def pg_dsn(self) -> str:
        return (
            f"postgresql+psycopg://{self.pg_user}:{self.pg_password}"
            f"@{self.pg_host}:{self.pg_port}/{self.pg_database}"
        )

    # Vertex AI
    vertex_embedding_model: str = "text-embedding-004"
    vertex_llm_model: str = "gemini-2.0-flash-001"
    vertex_embedding_batch_size: int = 250
    vertex_embedding_dim: int = 768
    # Backwards-compatible alias kept so existing tests/embedder keep working.
    vertex_embedding_dimensions: int = 768

    # Vector Search (generic — restrict by source_type at query time)
    vector_search_index_id: str | None = None
    vector_search_index_legal: str | None = None  # legacy alias
    vector_search_endpoint_id: str | None = None
    vector_search_deployed_index_id: str = "integreat_risk_dev_v1"

    # Neo4j (optional)
    neo4j_uri: str | None = None
    neo4j_user: str = "neo4j"
    neo4j_password: str | None = None

    # Pub/Sub
    pipeline_risk_topic_id: str = "risk-updates"
    pubsub_topic_legal_updates: str = "risk-updates"  # legacy alias

    # Chunking
    chunk_max_tokens: int = 1000
    chunk_overlap_tokens: int = 100

    # Crawler
    eurlex_base_url: str = "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/"
    eurlex_user_agent: str = "INTEGREAT-RiskCrawler/0.2 (+https://integreat.example)"
    http_timeout_seconds: float = 30.0
    http_max_retries: int = 5

    log_level: str = "INFO"

    @property
    def vector_search_index(self) -> str | None:
        """Effective VS index resource (new key wins, legacy fallback)."""
        return self.vector_search_index_id or self.vector_search_index_legal


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
