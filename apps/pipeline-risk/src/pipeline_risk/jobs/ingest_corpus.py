"""INTEGREAT — Cloud Run Job: ingest one or more regulations end-to-end.

Usage (locally):
    python -m pipeline_risk.jobs.ingest_corpus --regulation dora
    python -m pipeline_risk.jobs.ingest_corpus --all

Environment:
    INTEGREAT_GCP_PROJECT_ID, INTEGREAT_GCP_REGION, INTEGREAT_RAW_LEGAL_BUCKET,
    INTEGREAT_PG_*, INTEGREAT_VECTOR_SEARCH_INDEX_LEGAL, INTEGREAT_NEO4J_*

Pub/Sub: at the end of a successful ingestion, publishes a message on
INTEGREAT_PUBSUB_TOPIC_LEGAL_UPDATES with { regulation_id, celex, chunks, obligations, run_id }.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import uuid
from datetime import UTC, datetime

from google.cloud import storage

from pipeline_risk.chunker import chunk_articles
from pipeline_risk.corpus import CORPUS, get_regulation
from pipeline_risk.crawlers.eurlex import GCSWriter, crawl_eurlex
from pipeline_risk.embedder import VertexEmbeddingClient, embed_chunks
from pipeline_risk.extractor import VertexGeminiClient, extract_obligations
from pipeline_risk.indexer import (
    Neo4jWriter,
    NoopGraphWriter,
    TripleIndexer,
    VertexVectorSearchUpserter,
)
from pipeline_risk.logging_setup import configure_logging, get_logger
from pipeline_risk.models import Article, Regulation
from pipeline_risk.parsers.html_parser import parse_eurlex_html
from pipeline_risk.settings import Settings, get_settings

log = get_logger(__name__)


def _parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Ingest a regulation into INTEGREAT legal corpus.")
    g = p.add_mutually_exclusive_group(required=True)
    g.add_argument("--regulation", help="Regulation slug (e.g. dora, mica, ai_act, rgpd)")
    g.add_argument("--all", action="store_true", help="Ingest every regulation in the catalogue")
    p.add_argument("--skip-extract", action="store_true", help="Skip Gemini obligation extraction")
    return p.parse_args(argv)


def _read_html_from_gcs(uri: str) -> bytes:
    assert uri.startswith("gs://"), uri
    bucket, _, blob = uri[len("gs://") :].partition("/")
    return storage.Client().bucket(bucket).blob(blob).download_as_bytes()


def _build_indexer(settings: Settings) -> TripleIndexer:
    vs_writer = None
    if settings.vector_search_index_legal:
        vs_writer = VertexVectorSearchUpserter(
            index_resource_name=settings.vector_search_index_legal
        )
    if settings.neo4j_uri and settings.neo4j_password:
        graph = Neo4jWriter(
            uri=settings.neo4j_uri,
            user=settings.neo4j_user,
            password=settings.neo4j_password,
        )
    else:
        graph = NoopGraphWriter()
    return TripleIndexer(settings=settings, vs_writer=vs_writer, graph_writer=graph)


def _publish_update(settings: Settings, payload: dict) -> None:
    try:
        from google.cloud import pubsub_v1

        publisher = pubsub_v1.PublisherClient()
        topic_path = publisher.topic_path(
            settings.gcp_project_id, settings.pubsub_topic_legal_updates
        )
        publisher.publish(topic_path, json.dumps(payload).encode("utf-8")).result(timeout=30)
        log.info("pubsub.publish.ok", topic=topic_path)
    except Exception as exc:  # noqa: BLE001 - non-fatal
        log.warning("pubsub.publish.failed", error=str(exc))


def ingest_one(
    regulation: Regulation,
    *,
    settings: Settings,
    skip_extract: bool = False,
) -> dict:
    run_id = str(uuid.uuid4())
    log.info("ingest.start", regulation=regulation.regulation_id, run_id=run_id)

    # 1. Crawl
    crawl = crawl_eurlex(regulation.celex, settings=settings, writer=GCSWriter())

    # 2. Parse
    html = _read_html_from_gcs(crawl.storage_uri)
    articles: list[Article] = parse_eurlex_html(html, regulation_id=regulation.regulation_id)
    log.info("parse.ok", regulation=regulation.regulation_id, articles=len(articles))

    # 3. Chunk
    chunks = chunk_articles(
        articles,
        max_tokens=settings.chunk_max_tokens,
        overlap_tokens=settings.chunk_overlap_tokens,
    )
    for c in chunks:
        c.source_url = f"https://eur-lex.europa.eu/eli/reg/{regulation.celex}/oj"
    log.info("chunk.ok", regulation=regulation.regulation_id, chunks=len(chunks))

    # 4. Embed
    embed_client = VertexEmbeddingClient(
        project_id=settings.gcp_project_id,
        region=settings.gcp_region,
        model_name=settings.vertex_embedding_model,
    )
    embedded = embed_chunks(chunks, settings=settings, client=embed_client)

    # 5. Index (PG + VS + Neo4j)
    indexer = _build_indexer(settings)
    counts = indexer.index(embedded)

    # 6. Extract obligations (LLM)
    obligations: list = []
    if not skip_extract:
        gemini = VertexGeminiClient(
            project_id=settings.gcp_project_id,
            region=settings.gcp_region,
            model_name=settings.vertex_llm_model,
        )
        for art in articles:
            obligations.extend(extract_obligations(art, settings=settings, client=gemini))
        log.info(
            "obligations.extract.total",
            regulation=regulation.regulation_id,
            obligations=len(obligations),
        )

    # 7. Notify
    payload = {
        "run_id": run_id,
        "regulation_id": regulation.regulation_id,
        "celex": regulation.celex,
        "articles": len(articles),
        "chunks": len(chunks),
        "obligations": len(obligations),
        "completed_at": datetime.now(UTC).isoformat(),
        "indexed": counts,
    }
    _publish_update(settings, payload)
    log.info("ingest.done", **payload)
    return payload


def main(argv: list[str] | None = None) -> int:
    settings = get_settings()
    configure_logging(settings.log_level)
    args = _parse_args(argv if argv is not None else sys.argv[1:])

    targets = list(CORPUS.values()) if args.all else [get_regulation(args.regulation)]

    summary: list[dict] = []
    for reg in targets:
        summary.append(ingest_one(reg, settings=settings, skip_extract=args.skip_extract))

    print(json.dumps({"summary": summary}, indent=2))
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
