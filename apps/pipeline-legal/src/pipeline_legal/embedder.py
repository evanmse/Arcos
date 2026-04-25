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

from pipeline_legal.logging_setup import get_logger
from pipeline_legal.models import Chunk, EmbeddedChunk
from pipeline_legal.settings import Settings

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


def _batched(items: list[Chunk], size: int) -> Iterable[list[Chunk]]:
    for i in range(0, len(items), size):
        yield items[i : i + size]


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
    out: list[EmbeddedChunk] = []
    for batch in _batched(chunks, batch_size):
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
