from __future__ import annotations

import pytest

from pipeline_risk.embedder import EmbeddingClient, embed_chunks
from pipeline_risk.models import Chunk
from pipeline_risk.settings import Settings


class FakeClient(EmbeddingClient):
    def __init__(self, dim: int = 768) -> None:
        self.dim = dim
        self.calls: list[list[str]] = []

    def embed(self, texts: list[str]) -> list[list[float]]:
        self.calls.append(texts)
        return [[float(i % 7) / 10.0] * self.dim for i in range(len(texts))]


def make_chunks(n: int) -> list[Chunk]:
    return [
        Chunk(
            chunk_id=f"c{i}",
            regulation_id="dora",
            article_number="28",
            paragraph_number=str(i),
            chapter=None,
            text=f"para {i}",
            token_count=10,
        )
        for i in range(n)
    ]


def test_embed_chunks_batches_correctly():
    settings = Settings(env="test", vertex_embedding_batch_size=4, vertex_embedding_dimensions=768)
    client = FakeClient(dim=768)
    chunks = make_chunks(10)

    out = embed_chunks(chunks, settings=settings, client=client)

    assert len(out) == 10
    assert [len(b) for b in client.calls] == [4, 4, 2]
    assert all(len(c.embedding) == 768 for c in out)
    assert out[0].chunk_id == "c0"


def test_embed_chunks_empty_returns_empty():
    settings = Settings(env="test")
    assert embed_chunks([], settings=settings, client=FakeClient()) == []


def test_embed_chunks_dim_mismatch_raises():
    settings = Settings(env="test", vertex_embedding_dimensions=768)
    client = FakeClient(dim=128)
    with pytest.raises(RuntimeError, match="unexpected embedding dim"):
        embed_chunks(make_chunks(1), settings=settings, client=client)


def test_embed_chunks_count_mismatch_raises():
    class BadClient(EmbeddingClient):
        def embed(self, texts):
            return [[0.0] * 768]  # always returns 1

    settings = Settings(env="test", vertex_embedding_batch_size=10)
    with pytest.raises(RuntimeError, match="embedding count mismatch"):
        embed_chunks(make_chunks(3), settings=settings, client=BadClient())
