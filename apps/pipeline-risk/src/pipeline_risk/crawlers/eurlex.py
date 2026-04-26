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

from pipeline_risk.logging_setup import get_logger
from pipeline_risk.models import CrawlResult
from pipeline_risk.settings import Settings

log = get_logger(__name__)


class StorageWriter(Protocol):
    """Minimal interface so tests can swap in a fake."""

    def write_bytes(self, bucket: str, blob_name: str, data: bytes, content_type: str) -> str: ...

    def read_bytes(self, bucket: str, blob_name: str) -> bytes | None: ...


class GCSWriter:
    """google-cloud-storage adapter."""

    def __init__(self) -> None:
        from google.cloud import storage  # local import → faster cold start

        self._client = storage.Client()

    def write_bytes(self, bucket: str, blob_name: str, data: bytes, content_type: str) -> str:
        blob = self._client.bucket(bucket).blob(blob_name)
        blob.upload_from_string(data, content_type=content_type)
        return f"gs://{bucket}/{blob_name}"

    def read_bytes(self, bucket: str, blob_name: str) -> bytes | None:
        blob = self._client.bucket(bucket).blob(blob_name)
        if not blob.exists():
            return None
        return blob.download_as_bytes()


class WAFChallengeError(httpx.HTTPError):
    """Raised when EUR-Lex returns an AWS WAF challenge page (HTTP 202 + tiny body)."""


def _looks_like_waf_challenge(content: bytes, status_code: int) -> bool:
    # CloudFront returns 202 + small HTML body containing `awsWafCookieDomainList`
    # / `id="challenge-container"` when it wants the client to solve a JS puzzle.
    if status_code == 202:
        return True
    if len(content) < 8000 and (
        b"challenge-container" in content or b"awsWafCookie" in content
    ):
        return True
    return False


@retry(
    retry=retry_if_exception_type((httpx.TransportError, httpx.HTTPStatusError, WAFChallengeError)),
    wait=wait_exponential(multiplier=2, min=4, max=120),
    stop=stop_after_attempt(6),
    reraise=True,
)
def _fetch(url: str, *, timeout: float, user_agent: str) -> bytes:
    with httpx.Client(
        timeout=timeout,
        headers={
            "User-Agent": user_agent,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-GB,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "Cache-Control": "no-cache",
        },
        follow_redirects=True,
    ) as client:
        response = client.get(url)
        if _looks_like_waf_challenge(response.content, response.status_code):
            raise WAFChallengeError(
                f"AWS WAF challenge from EUR-Lex (status={response.status_code}, "
                f"bytes={len(response.content)}) for {url}"
            )
        response.raise_for_status()
        return response.content


def build_eurlex_url(celex: str, *, lang: str = "EN", base_url: str | None = None) -> str:
    """Return the EUR-Lex HTML URL for a CELEX identifier.

    EUR-Lex provides a stable HTML rendering at:
      https://eur-lex.europa.eu/legal-content/{LANG}/TXT/HTML/?uri=CELEX:{CELEX}&from={LANG}

    Note: the trailing ``&from={LANG}`` parameter is what bypasses the
    CloudFront/AWS WAF challenge that EUR-Lex now serves to bare bot UAs.
    Without it, the endpoint returns HTTP 202 + a 2 KB JS challenge page.
    """
    base = (base_url or "https://eur-lex.europa.eu/legal-content/").rstrip("/")
    return f"{base}/{lang}/TXT/HTML/?uri=CELEX:{celex}&from={lang}"


_SPARQL_ENDPOINT = "https://publications.europa.eu/webapi/rdf/sparql"
_LANG_AUTHORITY = {
    "EN": "ENG",
    "FR": "FRA",
    "DE": "DEU",
    "ES": "SPA",
    "IT": "ITA",
}


def resolve_cellar_xhtml_url(celex: str, *, lang: str = "EN", timeout: float = 30.0) -> str | None:
    """Resolve the Publications Office Cellar XHTML manifestation for a CELEX.

    This goes through the SPARQL endpoint at publications.europa.eu (NOT
    behind the eur-lex.europa.eu CloudFront WAF), so it is reachable from
    Cloud Run egress IPs that have been flagged. Returns the direct
    file URL for the XHTML manifestation, or ``None`` if not found.
    """
    auth = _LANG_AUTHORITY.get(lang.upper(), "ENG")
    # Try multiple HTML-like manifestation types in priority order so that
    # regulations not published as XHTML (e.g. DORA, MiCA, GDPR) still resolve.
    query = f'''PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
SELECT ?file ?mtype WHERE {{
  ?work cdm:resource_legal_id_celex ?celex . FILTER(STR(?celex) = "{celex}")
  ?expression cdm:expression_belongs_to_work ?work ;
              cdm:expression_uses_language <http://publications.europa.eu/resource/authority/language/{auth}> .
  ?manif cdm:manifestation_manifests_expression ?expression ;
         cdm:manifestation_type ?mtype .
  FILTER(?mtype IN ("xhtml", "html", "fmx4", "html_simpl", "xhtml_simpl"))
  ?file cdm:item_belongs_to_manifestation ?manif .
}}'''
    try:
        with httpx.Client(timeout=timeout) as client:
            r = client.get(
                _SPARQL_ENDPOINT,
                params={"query": query, "format": "application/sparql-results+json"},
            )
            r.raise_for_status()
            data = r.json()
            bindings = data.get("results", {}).get("bindings", [])
            if not bindings:
                return None
            # Priority order: prefer xhtml, then html_simpl, then html, then fmx4
            priority = {"xhtml": 0, "xhtml_simpl": 1, "html_simpl": 2, "html": 3, "fmx4": 4}
            best = min(bindings, key=lambda b: priority.get(b.get("mtype", {}).get("value", ""), 99))
            return best["file"]["value"]
    except Exception as exc:  # pragma: no cover - network/JSON edge cases
        log.warning("cellar.resolve.failed", celex=celex, error=str(exc))
        return None


@retry(
    retry=retry_if_exception_type((httpx.TransportError, httpx.HTTPStatusError)),
    wait=wait_exponential(multiplier=2, min=2, max=30),
    stop=stop_after_attempt(4),
    reraise=True,
)
def _fetch_cellar(url: str, *, timeout: float) -> bytes:
    with httpx.Client(timeout=timeout, follow_redirects=True, headers={
        "Accept": "application/xhtml+xml,text/html,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-GB,en;q=0.9",
        "User-Agent": "integreat-risk-crawler/1.0 (+contact@hasfy.fr)",
    }) as client:
        # Cellar ``cdm:item_belongs_to_manifestation`` URIs use scheme ``http://``
        # but redirect to https. follow_redirects=True handles it.
        response = client.get(url)
        response.raise_for_status()
        return response.content


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

    # WAF fallback chain (EUR-Lex CloudFront WAF blocks Cloud Run egress IPs):
    #   1. snapshot at gs://{raw_bucket}/eurlex/{celex}/snapshot.html
    #   2. Publications Office Cellar XHTML (via SPARQL discovery) — not WAFed
    #   3. live EUR-Lex HTML (last resort, may hit 202 JS challenge)
    snapshot_blob = f"eurlex/{celex}/snapshot.html"
    content: bytes | None = None
    try:
        content = writer.read_bytes(settings.raw_legal_bucket, snapshot_blob)
    except Exception as exc:  # pragma: no cover - defensive
        log.warning("eurlex.snapshot.read_failed", celex=celex, error=str(exc))
        content = None
    if content:
        log.info(
            "eurlex.snapshot.hit",
            celex=celex,
            bytes=len(content),
            uri=f"gs://{settings.raw_legal_bucket}/{snapshot_blob}",
        )
    else:
        cellar_url = resolve_cellar_xhtml_url(celex, lang=lang)
        if cellar_url:
            log.info("eurlex.cellar.try", celex=celex, url=cellar_url)
            try:
                content = _fetch_cellar(cellar_url, timeout=settings.http_timeout_seconds)
                log.info("eurlex.cellar.ok", celex=celex, bytes=len(content))
            except Exception as exc:
                log.warning("eurlex.cellar.failed", celex=celex, error=str(exc))
                content = None
        if not content:
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
