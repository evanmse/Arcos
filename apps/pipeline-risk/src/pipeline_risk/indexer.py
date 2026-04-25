"""Triple-write indexer (Postgres + Vertex AI Vector Search + Neo4j).

Generalised to source_type in {regulation, standard, insurance}. Vector Search
restricts include `source_type` and `source_id` so the same physical index can
serve regulations, standards and insurance corpora.

Neo4j (optional — no-op if creds absent) builds the **Risk Graph**:
  Regulation -[:HAS_ARTICLE]-> Article -[:DEFINES]-> Obligation
  Standard   -[:HAS_SECTION]-> StandardSection -[:DEFINES]-> Obligation
  Obligation -[:CATEGORIZED_AS]-> RiskCategory
  InsuranceClause -[:COVERS|EXCLUDES]-> RiskCategory
  Obligation -[:MITIGATES]-> RiskCategory
"""
from __future__ import annotations

from collections.abc import Iterable
from typing import Protocol

from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from pipeline_risk.db.engine import engine_from_settings
from pipeline_risk.db.models import InsuranceClauseRow, RiskChunk
from pipeline_risk.logging_setup import get_logger
from pipeline_risk.models import (
    EmbeddedChunk,
    InsuranceClause,
    Obligation,
    RiskObligation,
    SourceType,
    StandardSection,
)
from pipeline_risk.settings import Settings

log = get_logger(__name__)


class VectorSearchUpserter(Protocol):
    def upsert(self, chunks: list[EmbeddedChunk]) -> int: ...


class GraphWriter(Protocol):
    def write_chunks(self, chunks: list[EmbeddedChunk]) -> int: ...


class VertexVectorSearchUpserter:
    """Stream-upsert datapoints into a Matching Engine index with source_type restrict."""

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
                        namespace="source_type",
                        allow_list=[c.source_type.value if hasattr(c.source_type, "value") else str(c.source_type)],
                    ),
                    aiplatform_v1.IndexDatapoint.Restriction(
                        namespace="source_id",
                        allow_list=[c.source_id or c.regulation_id],
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


class Neo4jWriter:
    """Risk Graph writer (idempotent MERGEs)."""

    def __init__(self, *, uri: str, user: str, password: str) -> None:
        from neo4j import GraphDatabase

        self._driver = GraphDatabase.driver(uri, auth=(user, password))

    def close(self) -> None:
        self._driver.close()

    def write_chunks(self, chunks: list[EmbeddedChunk]) -> int:
        if not chunks:
            return 0
        regulation_rows = [c for c in chunks if _source_type(c) == SourceType.REGULATION.value]
        standard_rows = [c for c in chunks if _source_type(c) == SourceType.STANDARD.value]

        with self._driver.session() as session:
            if regulation_rows:
                session.run(
                    """
                    UNWIND $rows AS row
                    MERGE (r:Regulation {id: row.source_id})
                    MERGE (a:Article {regulation_id: row.source_id, number: row.article_number})
                    MERGE (r)-[:HAS_ARTICLE]->(a)
                    MERGE (c:Chunk {id: row.chunk_id})
                      SET c.text = row.text,
                          c.token_count = row.token_count,
                          c.lang = row.lang,
                          c.source_type = 'regulation'
                    MERGE (a)-[:HAS_CHUNK]->(c)
                    """,
                    rows=[_chunk_row(c) for c in regulation_rows],
                )
            if standard_rows:
                session.run(
                    """
                    UNWIND $rows AS row
                    MERGE (s:Standard {id: row.source_id})
                    MERGE (sec:StandardSection {standard_id: row.source_id, section_id: row.article_number})
                    MERGE (s)-[:HAS_SECTION]->(sec)
                    MERGE (c:Chunk {id: row.chunk_id})
                      SET c.text = row.text,
                          c.token_count = row.token_count,
                          c.lang = row.lang,
                          c.source_type = 'standard'
                    MERGE (sec)-[:HAS_CHUNK]->(c)
                    """,
                    rows=[_chunk_row(c) for c in standard_rows],
                )
        return len(chunks)

    def write_standard_sections(self, standard_id: str, sections: list[StandardSection]) -> int:
        if not sections:
            return 0
        with self._driver.session() as session:
            session.run(
                """
                MERGE (s:Standard {id: $standard_id})
                WITH s
                UNWIND $rows AS row
                MERGE (sec:StandardSection {standard_id: $standard_id, section_id: row.section_id})
                  SET sec.title = row.title,
                      sec.chapter = row.chapter
                MERGE (s)-[:HAS_SECTION]->(sec)
                """,
                standard_id=standard_id,
                rows=[s.model_dump() for s in sections],
            )
        return len(sections)

    def write_obligations(self, obligations: list[RiskObligation | Obligation]) -> int:
        if not obligations:
            return 0
        rows = []
        for o in obligations:
            if isinstance(o, RiskObligation):
                rows.append(
                    {
                        "id": o.obligation_id,
                        "source_type": o.source_type.value,
                        "source_id": o.source_id,
                        "ref": o.ref,
                        "text": o.text,
                        "risk_categories": [rc.value for rc in o.risk_categories],
                    }
                )
            else:  # legacy Obligation
                rows.append(
                    {
                        "id": o.id,
                        "source_type": "regulation",
                        "source_id": o.regulation_id,
                        "ref": o.article_number,
                        "text": o.text,
                        "risk_categories": [
                            rc.value if hasattr(rc, "value") else rc for rc in o.risk_categories
                        ],
                    }
                )
        with self._driver.session() as session:
            session.run(
                """
                UNWIND $rows AS row
                MERGE (o:Obligation {id: row.id})
                  SET o.text = row.text,
                      o.source_type = row.source_type,
                      o.source_id = row.source_id,
                      o.ref = row.ref
                FOREACH (cat IN row.risk_categories |
                    MERGE (rc:RiskCategory {id: cat})
                    MERGE (o)-[:CATEGORIZED_AS]->(rc)
                    MERGE (o)-[:MITIGATES]->(rc)
                )
                """,
                rows=rows,
            )
        return len(rows)

    def write_insurance_clauses(self, catalog_id: str, clauses: list[InsuranceClause]) -> int:
        if not clauses:
            return 0
        rows = [
            {
                "clause_id": c.clause_id,
                "clause_type": c.clause_type,
                "title": c.title,
                "text": c.text,
                "categories": [rc.value for rc in c.applicable_risk_categories],
                "min_trust_score": c.min_trust_score,
            }
            for c in clauses
        ]
        with self._driver.session() as session:
            session.run(
                """
                MERGE (cat:InsuranceCatalog {id: $catalog_id})
                WITH cat
                UNWIND $rows AS row
                MERGE (cl:InsuranceClause {id: row.clause_id})
                  SET cl.clause_type = row.clause_type,
                      cl.title = row.title,
                      cl.text = row.text,
                      cl.min_trust_score = row.min_trust_score
                MERGE (cat)-[:HAS_CLAUSE]->(cl)
                FOREACH (catg IN row.categories |
                    MERGE (rc:RiskCategory {id: catg})
                    FOREACH (_ IN CASE WHEN row.clause_type = 'exclusion' THEN [1] ELSE [] END |
                        MERGE (cl)-[:EXCLUDES]->(rc)
                    )
                    FOREACH (_ IN CASE WHEN row.clause_type = 'coverage' THEN [1] ELSE [] END |
                        MERGE (cl)-[:COVERS]->(rc)
                    )
                )
                """,
                catalog_id=catalog_id,
                rows=rows,
            )
        return len(rows)


class NoopGraphWriter:
    def write_chunks(self, chunks: list[EmbeddedChunk]) -> int:
        return 0

    def write_standard_sections(self, standard_id: str, sections: list[StandardSection]) -> int:
        return 0

    def write_obligations(self, obligations: list) -> int:
        return 0

    def write_insurance_clauses(self, catalog_id: str, clauses: list[InsuranceClause]) -> int:
        return 0


def _source_type(c: EmbeddedChunk) -> str:
    return c.source_type.value if hasattr(c.source_type, "value") else str(c.source_type)


def _chunk_row(c: EmbeddedChunk) -> dict:
    return {
        "source_id": c.source_id or c.regulation_id,
        "article_number": c.article_number,
        "chunk_id": c.chunk_id,
        "text": c.text,
        "token_count": c.token_count,
        "lang": c.lang,
    }


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

    def index(
        self,
        chunks: Iterable[EmbeddedChunk],
        *,
        source_type: SourceType | None = None,
    ) -> dict[str, int]:
        chunks = list(chunks)
        if source_type is not None:
            for c in chunks:
                c.source_type = source_type
                if c.source_id is None:
                    c.source_id = c.regulation_id

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

    def upsert_insurance_clauses(
        self, catalog_id: str, clauses: list[InsuranceClause], embeddings: list[list[float]]
    ) -> int:
        if not clauses:
            return 0
        rows = [
            {
                "clause_id": c.clause_id,
                "catalog_id": catalog_id,
                "clause_type": c.clause_type,
                "title": c.title,
                "text": c.text,
                "applicable_risk_categories": [rc.value for rc in c.applicable_risk_categories],
                "min_trust_score": c.min_trust_score,
                "embedding": emb,
            }
            for c, emb in zip(clauses, embeddings, strict=True)
        ]
        with Session(self._engine) as session:
            stmt = pg_insert(InsuranceClauseRow).values(rows)
            stmt = stmt.on_conflict_do_update(
                index_elements=[InsuranceClauseRow.clause_id],
                set_={
                    "text": stmt.excluded.text,
                    "title": stmt.excluded.title,
                    "embedding": stmt.excluded.embedding,
                    "min_trust_score": stmt.excluded.min_trust_score,
                },
            )
            session.execute(stmt)
            session.commit()
        return len(rows)

    def _upsert_postgres(self, chunks: list[EmbeddedChunk]) -> int:
        rows = [
            {
                "chunk_id": c.chunk_id,
                "source_type": _source_type(c),
                "source_id": c.source_id or c.regulation_id,
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
            stmt = pg_insert(RiskChunk).values(rows)
            stmt = stmt.on_conflict_do_update(
                index_elements=[RiskChunk.chunk_id],
                set_={
                    "text": stmt.excluded.text,
                    "embedding": stmt.excluded.embedding,
                    "token_count": stmt.excluded.token_count,
                },
            )
            session.execute(stmt)
            session.commit()
        return len(rows)
