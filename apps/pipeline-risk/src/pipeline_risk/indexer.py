"""Triple-write indexer.

Writes embedded chunks to:
  1. Vertex AI Vector Search (stream upsert, with metadata restricts).
  2. Postgres (legal_chunks table) with the embedding stored in pgvector
     as a fallback / for join queries.
  3. Neo4j as ``(:Article)-[:HAS_CHUNK]->(:Chunk)`` nodes (optional, no-op if
     Neo4j credentials are missing).

Each subsystem is behind a Protocol so tests can mock independently.
"""
from __future__ import annotations

from collections.abc import Iterable
from typing import Protocol

from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from pipeline_risk.db.engine import engine_from_settings
from pipeline_risk.db.models import LegalChunk
from pipeline_risk.logging_setup import get_logger
from pipeline_risk.models import EmbeddedChunk
from pipeline_risk.settings import Settings

log = get_logger(__name__)


class VectorSearchUpserter(Protocol):
    def upsert(self, chunks: list[EmbeddedChunk]) -> int: ...


class GraphWriter(Protocol):
    def write_chunks(self, chunks: list[EmbeddedChunk]) -> int: ...


# ---------------------------------------------------------------------------
# Vertex AI Vector Search adapter
# ---------------------------------------------------------------------------
class VertexVectorSearchUpserter:
    """Stream-upsert datapoints into a Matching Engine index."""

    def __init__(self, *, index_resource_name: str) -> None:
        from google.cloud import aiplatform_v1

        self._client = aiplatform_v1.IndexServiceClient(
            client_options={"api_endpoint": "europe-west1-aiplatform.googleapis.com"}
        )
        self._index = index_resource_name

    def upsert(self, chunks: list[EmbeddedChunk]) -> int:
        from google.cloud import aiplatform_v1

        if not chunks:
            return 0

        datapoints = [
            aiplatform_v1.IndexDatapoint(
                datapoint_id=c.chunk_id,
                feature_vector=c.embedding,
                restricts=[
                    aiplatform_v1.IndexDatapoint.Restriction(
                        namespace="regulation_id", allow_list=[c.regulation_id]
                    ),
                    aiplatform_v1.IndexDatapoint.Restriction(
                        namespace="lang", allow_list=[c.lang]
                    ),
                ],
            )
            for c in chunks
        ]
        request = aiplatform_v1.UpsertDatapointsRequest(
            index=self._index, datapoints=datapoints
        )
        self._client.upsert_datapoints(request=request)
        return len(datapoints)


# ---------------------------------------------------------------------------
# Neo4j adapter (optional)
# ---------------------------------------------------------------------------
class Neo4jWriter:
    def __init__(self, *, uri: str, user: str, password: str) -> None:
        from neo4j import GraphDatabase

        self._driver = GraphDatabase.driver(uri, auth=(user, password))

    def close(self) -> None:
        self._driver.close()

    def write_chunks(self, chunks: list[EmbeddedChunk]) -> int:
        if not chunks:
            return 0
        cypher = """
        UNWIND $rows AS row
        MERGE (r:Regulation {id: row.regulation_id})
        MERGE (a:Article {regulation_id: row.regulation_id, number: row.article_number})
        MERGE (r)-[:HAS_ARTICLE]->(a)
        MERGE (c:Chunk {id: row.chunk_id})
          SET c.text = row.text,
              c.token_count = row.token_count,
              c.lang = row.lang
        MERGE (a)-[:HAS_CHUNK]->(c)
        """
        rows = [
            {
                "regulation_id": c.regulation_id,
                "article_number": c.article_number,
                "chunk_id": c.chunk_id,
                "text": c.text,
                "token_count": c.token_count,
                "lang": c.lang,
            }
            for c in chunks
        ]
        with self._driver.session() as session:
            session.run(cypher, rows=rows)
        return len(rows)


class NoopGraphWriter:
    def write_chunks(self, chunks: list[EmbeddedChunk]) -> int:
        return 0


# ---------------------------------------------------------------------------
# Triple writer
# ---------------------------------------------------------------------------
class TripleIndexer:
    def __init__(
        self,
        *,
        settings: Settings,
        vs_writer: VectorSearchUpserter | None = None,
        graph_writer: GraphWriter | None = None,
        engine_factory=engine_from_settings,
    ) -> None:
        self._settings = settings
        self._vs = vs_writer
        self._graph = graph_writer or NoopGraphWriter()
        self._engine = engine_factory(settings)

    def index(self, chunks: Iterable[EmbeddedChunk]) -> dict[str, int]:
        chunks = list(chunks)
        if not chunks:
            return {"postgres": 0, "vector_search": 0, "graph": 0}

        pg_count = self._upsert_postgres(chunks)
        vs_count = self._vs.upsert(chunks) if self._vs is not None else 0
        graph_count = self._graph.write_chunks(chunks)

        log.info(
            "triple_index.ok",
            postgres=pg_count,
            vector_search=vs_count,
            graph=graph_count,
        )
        return {"postgres": pg_count, "vector_search": vs_count, "graph": graph_count}

    def _upsert_postgres(self, chunks: list[EmbeddedChunk]) -> int:
        rows = [
            {
                "chunk_id": c.chunk_id,
                "regulation_id": c.regulation_id,
                "article_number": c.article_number,
                "paragraph_number": c.paragraph_number,
                "chapter": c.chapter,
                "text": c.text,
                "token_count": c.token_count,
                "lang": c.lang,
                "source_url": c.source_url,
                "embedding": c.embedding,
            }
            for c in chunks
        ]
        with Session(self._engine) as session:
            stmt = pg_insert(LegalChunk).values(rows)
            stmt = stmt.on_conflict_do_update(
                index_elements=[LegalChunk.chunk_id],
                set_={
                    "text": stmt.excluded.text,
                    "embedding": stmt.excluded.embedding,
                    "token_count": stmt.excluded.token_count,
                },
            )
            session.execute(stmt)
            session.commit()
        return len(rows)
