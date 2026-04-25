"""EUR-Lex crawler.

Fetches the consolidated HTML version of a regulation by CELEX number and
persists it to GCS at gs://{bucket}/eurlex/{celex}/{YYYY-MM-DD}.html.
"""
from __future__ import annotations

import hashlib
from datetime import UTC, datetime
from typing import Protocol

import httpx
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from pipeline_legal.logging_setup import get_logger
from pipeline_legal.models import CrawlResult
from pipeline_legal.settings import Settings

log = get_logger(__name__)


class StorageWriter(Protocol):
    """Minimal interface so tests can swap in a fake."""

    def write_bytes(self, bucket: str, blob_name: str, data: bytes, content_type: str) -> str: ...


class GCSWriter:
    """google-cloud-storage adapter."""

    def __init__(self) -> None:
        from google.cloud import storage  # local import → faster cold start

        self._client = storage.Client()

    def write_bytes(self, bucket: str, blob_name: str, data: bytes, content_type: str) -> str:
        blob = self._client.bucket(bucket).blob(blob_name)
        blob.upload_from_string(data, content_type=content_type)
        return f"gs://{bucket}/{blob_name}"


@retry(
    retry=retry_if_exception_type((httpx.TransportError, httpx.HTTPStatusError)),
    wait=wait_exponential(multiplier=1, min=1, max=30),
    stop=stop_after_attempt(5),
    reraise=True,
)
def _fetch(url: str, *, timeout: float, user_agent: str) -> bytes:
    with httpx.Client(
        timeout=timeout,
        headers={"User-Agent": user_agent, "Accept": "text/html"},
        follow_redirects=True,
    ) as client:
        response = client.get(url)
        response.raise_for_status()
        return response.content


def build_eurlex_url(celex: str, *, lang: str = "EN", base_url: str | None = None) -> str:
    """Return the EUR-Lex HTML URL for a CELEX identifier.

    EUR-Lex provides a stable HTML rendering at:
      https://eur-lex.europa.eu/legal-content/{LANG}/TXT/HTML/?uri=CELEX:{CELEX}
    """
    base = (base_url or "https://eur-lex.europa.eu/legal-content/").rstrip("/")
    return f"{base}/{lang}/TXT/HTML/?uri=CELEX:{celex}"


def crawl_eurlex(
    celex: str,
    *,
    settings: Settings,
    writer: StorageWriter | None = None,
    fetched_at: datetime | None = None,
    lang: str = "EN",
) -> CrawlResult:
    """Fetch a CELEX regulation HTML and persist it to GCS."""
    writer = writer or GCSWriter()
    fetched_at = fetched_at or datetime.now(UTC)

    url = build_eurlex_url(celex, lang=lang, base_url=settings.eurlex_base_url)
    log.info("eurlex.fetch.start", celex=celex, url=url)

    content = _fetch(
        url,
        timeout=settings.http_timeout_seconds,
        user_agent=settings.eurlex_user_agent,
    )

    digest = hashlib.sha256(content).hexdigest()
    blob_name = f"eurlex/{celex}/{fetched_at.strftime('%Y-%m-%d')}.html"
    uri = writer.write_bytes(
        settings.raw_legal_bucket,
        blob_name,
        content,
        content_type="text/html; charset=utf-8",
    )

    log.info(
        "eurlex.fetch.ok",
        celex=celex,
        bytes=len(content),
        sha256=digest[:12],
        uri=uri,
    )
    return CrawlResult(
        celex=celex,
        fetched_at=fetched_at,
        storage_uri=uri,
        sha256=digest,
        bytes=len(content),
    )
