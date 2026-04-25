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
        # Cloud SQL unix socket form: host=/cloudsql/PROJ:REGION:INSTANCE
        if self.pg_host.startswith("/"):
            return (
                f"postgresql+psycopg://{self.pg_user}:{self.pg_password}"
                f"@/{self.pg_database}?host={self.pg_host}"
            )
        return (
            f"postgresql+psycopg://{self.pg_user}:{self.pg_password}"
            f"@{self.pg_host}:{self.pg_port}/{self.pg_database}"
        )

    # Vertex AI — latest GA models (April 2026)
    vertex_embedding_model: str = "text-embedding-005"
    vertex_llm_model: str = "gemini-2.5-flash"
    # text-embedding-005 caps at 20K tokens / request. With ~1000-token chunks,
    # keep batch <= 16 to stay safely under the limit.
    vertex_embedding_batch_size: int = 16
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
    eurlex_base_url: str = "https://eur-lex.europa.eu/legal-content/"
    # Use a realistic browser UA — EUR-Lex sits behind CloudFront/AWS WAF which
    # serves a JS challenge to non-browser User-Agents.
    eurlex_user_agent: str = (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    )
    http_timeout_seconds: float = 30.0
    http_max_retries: int = 5

    log_level: str = "INFO"

    @property
    def vector_search_index(self) -> str | None:
        """Effective VS index resource name.

        Accepts either a numeric id (e.g. "7192464109189726208") or a full
        resource name (e.g. "projects/.../indexes/...") and always returns
        the full resource name expected by the aiplatform_v1 client.
        """
        raw = self.vector_search_index_id or self.vector_search_index_legal
        if not raw:
            return None
        if raw.startswith("projects/"):
            return raw
        return (
            f"projects/{self.gcp_project_id}/locations/{self.gcp_region}"
            f"/indexes/{raw}"
        )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
