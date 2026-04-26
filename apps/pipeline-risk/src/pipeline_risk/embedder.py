"""Vertex AI embedder.

Wraps `vertexai.language_models.TextEmbeddingModel` with batching, retries on
ResourceExhausted (429) and a swappable client for tests.
"""
from __future__ import annotations

from collections.abc import Iterable
from typing import Protocol

from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from pipeline_risk.logging_setup import get_logger
from pipeline_risk.models import Chunk, EmbeddedChunk
from pipeline_risk.settings import Settings

log = get_logger(__name__)


class EmbeddingClient(Protocol):
    def embed(self, texts: list[str]) -> list[list[float]]: ...


class VertexEmbeddingClient:
    """Concrete client backed by Vertex AI."""

    def __init__(self, *, project_id: str, region: str, model_name: str) -> None:
        # Local imports keep cold-start fast and let unit tests skip
        # google-cloud-aiplatform entirely via the EmbeddingClient protocol.
        import vertexai
        from vertexai.language_models import TextEmbeddingModel

        vertexai.init(project=project_id, location=region)
        self._model = TextEmbeddingModel.from_pretrained(model_name)

    @retry(
        retry=retry_if_exception_type(Exception),
        wait=wait_exponential(multiplier=1, min=2, max=60),
        stop=stop_after_attempt(6),
        reraise=True,
    )
    def embed(self, texts: list[str]) -> list[list[float]]:
        embeddings = self._model.get_embeddings(texts)
        return [e.values for e in embeddings]


# Vertex `text-embedding-005` rejects requests above ~20000 input tokens.
# Empirically, dense legal text in EU regulations averages ~2.5 chars/token,
# so a batch of 50k chars can exceed the cap (observed: 20116 tokens). Use
# 32k chars per batch (~12-13k tokens) to keep a comfortable safety margin.
_CHAR_BUDGET_PER_BATCH = 32_000
# A single chunk should never exceed ~18k tokens. We hard-truncate at
# 45k chars (~18k tokens worst case) to guarantee a single-item batch fits.
_MAX_CHARS_PER_CHUNK = 45_000


def _batched(items: list[Chunk], size: int) -> Iterable[list[Chunk]]:
    """Yield batches respecting both `size` and a per-batch character budget."""
    cur: list[Chunk] = []
    cur_chars = 0
    for c in items:
        clen = len(c.text)
        if cur and (len(cur) >= size or cur_chars + clen > _CHAR_BUDGET_PER_BATCH):
            yield cur
            cur = []
            cur_chars = 0
        cur.append(c)
        cur_chars += clen
    if cur:
        yield cur


def embed_chunks(
    chunks: list[Chunk],
    *,
    settings: Settings,
    client: EmbeddingClient | None = None,
) -> list[EmbeddedChunk]:
    """Embed a list of Chunks into EmbeddedChunks (batched)."""
    if not chunks:
        return []

    client = client or VertexEmbeddingClient(
        project_id=settings.gcp_project_id,
        region=settings.gcp_region,
        model_name=settings.vertex_embedding_model,
    )

    batch_size = settings.vertex_embedding_batch_size
    # Defensive truncation: any individual chunk longer than _MAX_CHARS_PER_CHUNK
    # would blow the per-request token cap on its own. Truncate in place.
    safe_chunks: list[Chunk] = []
    for c in chunks:
        if len(c.text) > _MAX_CHARS_PER_CHUNK:
            log.warning(
                "embed.chunk.truncated",
                chunk_id=c.chunk_id,
                regulation=c.regulation_id,
                original_chars=len(c.text),
                truncated_to=_MAX_CHARS_PER_CHUNK,
            )
            c = c.model_copy(update={"text": c.text[:_MAX_CHARS_PER_CHUNK]})
        safe_chunks.append(c)

    out: list[EmbeddedChunk] = []
    for batch in _batched(safe_chunks, batch_size):
        log.info("embed.batch.start", size=len(batch))
        vectors = client.embed([c.text for c in batch])
        if len(vectors) != len(batch):
            raise RuntimeError(
                f"embedding count mismatch: got {len(vectors)} for {len(batch)} chunks"
            )
        for chunk, vector in zip(batch, vectors, strict=True):
            if len(vector) != settings.vertex_embedding_dimensions:
                raise RuntimeError(
                    f"unexpected embedding dim: {len(vector)} "
                    f"(expected {settings.vertex_embedding_dimensions})"
                )
            out.append(
                EmbeddedChunk(
                    **chunk.model_dump(),
                    embedding=vector,
                )
            )
        log.info("embed.batch.ok", size=len(batch))

    return out
