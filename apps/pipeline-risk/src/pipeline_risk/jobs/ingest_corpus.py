"""INTEGREAT — Cloud Run Job: ingest regulations / standards / insurance.

Examples:
    python -m pipeline_risk.jobs.ingest_corpus --regulation ai_act
    python -m pipeline_risk.jobs.ingest_corpus --regulation all
    python -m pipeline_risk.jobs.ingest_corpus --standard iso_42001
    python -m pipeline_risk.jobs.ingest_corpus --standard all
    python -m pipeline_risk.jobs.ingest_corpus --insurance munichre
    python -m pipeline_risk.jobs.ingest_corpus --insurance all
    python -m pipeline_risk.jobs.ingest_corpus --all
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
import uuid
from datetime import UTC, datetime

from pipeline_risk.chunker import chunk_articles
from pipeline_risk.corpus import (
    INSURANCE_CATALOGS,
    REGULATIONS,
    STANDARDS,
    get_insurance_catalog,
    get_regulation,
    get_standard,
)
from pipeline_risk.crawlers.standards import load_standard
from pipeline_risk.embedder import VertexEmbeddingClient, embed_chunks
from pipeline_risk.extractor import VertexGeminiClient, extract_obligations
from pipeline_risk.indexer import (
    Neo4jWriter,
    NoopGraphWriter,
    TripleIndexer,
    VertexVectorSearchUpserter,
)
from pipeline_risk.insurance.loader import load_insurance_catalog
from pipeline_risk.logging_setup import configure_logging, get_logger
from pipeline_risk.models import (
    Article,
    Chunk,
    EmbeddedChunk,
    Regulation,
    RiskCategory,
    RiskDimension,
    RiskObligation,
    SourceType,
    Standard,
    StandardSection,
)
from pipeline_risk.settings import Settings, get_settings

log = get_logger(__name__)


def _parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Ingest INTEGREAT risk corpus.")
    g = p.add_mutually_exclusive_group(required=True)
    g.add_argument("--regulation")
    g.add_argument("--standard")
    g.add_argument("--insurance")
    g.add_argument("--all", action="store_true")
    p.add_argument("--skip-extract", action="store_true")
    return p.parse_args(argv)


def _build_indexer(settings: Settings) -> TripleIndexer:
    vs_writer = None
    if settings.vector_search_index:
        vs_writer = VertexVectorSearchUpserter(index_resource_name=settings.vector_search_index)
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
        topic_path = publisher.topic_path(settings.gcp_project_id, settings.pipeline_risk_topic_id)
        publisher.publish(topic_path, json.dumps(payload).encode("utf-8")).result(timeout=30)
        log.info("pubsub.publish.ok", topic=topic_path)
    except Exception as exc:  # noqa: BLE001
        log.warning("pubsub.publish.failed", error=str(exc))


# --- Regulations ---------------------------------------------------------

def ingest_regulation(reg: Regulation, *, settings: Settings, skip_extract: bool = False) -> dict:
    from pipeline_risk.crawlers.eurlex import GCSWriter, crawl_eurlex
    from pipeline_risk.parsers.html_parser import parse_eurlex_html

    run_id = str(uuid.uuid4())
    log.info("ingest.regulation.start", regulation=reg.regulation_id, run_id=run_id)

    crawl = crawl_eurlex(reg.celex, settings=settings, writer=GCSWriter())

    from google.cloud import storage

    assert crawl.storage_uri.startswith("gs://")
    bucket, _, blob = crawl.storage_uri[len("gs://") :].partition("/")
    html = storage.Client().bucket(bucket).blob(blob).download_as_bytes()

    articles: list[Article] = parse_eurlex_html(html, regulation_id=reg.regulation_id)
    chunks = chunk_articles(
        articles,
        max_tokens=settings.chunk_max_tokens,
        overlap_tokens=settings.chunk_overlap_tokens,
    )
    for c in chunks:
        c.source_url = f"https://eur-lex.europa.eu/eli/reg/{reg.celex}/oj"
        c.source_type = SourceType.REGULATION
        c.source_id = reg.regulation_id

    embed_client = VertexEmbeddingClient(
        project_id=settings.gcp_project_id,
        region=settings.gcp_region,
        model_name=settings.vertex_embedding_model,
    )
    embedded = embed_chunks(chunks, settings=settings, client=embed_client)
    counts = _build_indexer(settings).index(embedded, source_type=SourceType.REGULATION)

    obligations: list = []
    if not skip_extract:
        gemini = VertexGeminiClient(
            project_id=settings.gcp_project_id,
            region=settings.gcp_region,
            model_name=settings.vertex_llm_model,
        )
        for art in articles:
            obligations.extend(extract_obligations(art, settings=settings, client=gemini))

    payload = {
        "run_id": run_id,
        "kind": "regulation",
        "source_id": reg.regulation_id,
        "celex": reg.celex,
        "articles": len(articles),
        "chunks": len(chunks),
        "obligations": len(obligations),
        "completed_at": datetime.now(UTC).isoformat(),
        "indexed": counts,
    }
    _publish_update(settings, payload)
    log.info("ingest.regulation.done", **payload)
    return payload


# --- Standards -----------------------------------------------------------

def _section_to_article(standard_id: str, sec: StandardSection) -> Article:
    return Article(
        regulation_id=standard_id,  # reused field for chunker compat
        article_number=sec.section_id,
        title=sec.title,
        chapter=sec.chapter,
        text=sec.text,
    )


def _section_obligation(standard: Standard, sec: StandardSection) -> RiskObligation:
    raw_text = sec.text
    sections_lower = (sec.title + " " + sec.text).lower()
    risk_categories: list[RiskCategory] = []
    if any(k in sections_lower for k in ("bias", "fairness", "discrim")):
        risk_categories.append(RiskCategory.BIAS)
    if any(k in sections_lower for k in ("transpar", "disclos", "explain")):
        risk_categories.append(RiskCategory.TRANSPARENCY)
    if "human" in sections_lower or "oversight" in sections_lower:
        risk_categories.append(RiskCategory.HUMAN_OVERSIGHT)
    if "incident" in sections_lower:
        risk_categories.append(RiskCategory.INCIDENT)
    if "security" in sections_lower or "adversari" in sections_lower:
        risk_categories.append(RiskCategory.SECURITY)
    if "data" in sections_lower or "privacy" in sections_lower:
        risk_categories.append(RiskCategory.DATA_PROTECTION)
    if "third" in sections_lower or "supply" in sections_lower:
        risk_categories.append(RiskCategory.THIRD_PARTY)
    if "governance" in sections_lower or "policy" in sections_lower or "leadership" in sections_lower:
        risk_categories.append(RiskCategory.AI_GOVERNANCE)
    if "monitor" in sections_lower or "audit" in sections_lower:
        risk_categories.append(RiskCategory.AUDIT)
    if "prompt injection" in sections_lower:
        risk_categories.append(RiskCategory.PROMPT_INJECTION)
    if not risk_categories:
        risk_categories.append(RiskCategory.AI_GOVERNANCE)

    obligation_id = hashlib.sha1(
        f"{standard.standard_id}|{sec.section_id}".encode()
    ).hexdigest()[:16]
    return RiskObligation(
        obligation_id=obligation_id,
        source_type=SourceType.STANDARD,
        source_id=standard.standard_id,
        ref=sec.section_id,
        text=raw_text,
        risk_categories=risk_categories,
        dimension=RiskDimension.TECHNICAL,
        domain="STANDARD",
    )


def ingest_standard(standard: Standard, *, settings: Settings) -> dict:
    run_id = str(uuid.uuid4())
    log.info("ingest.standard.start", standard=standard.standard_id, run_id=run_id)

    sections = load_standard(standard.standard_id, settings.data_dir)
    articles = [_section_to_article(standard.standard_id, s) for s in sections]
    chunks = chunk_articles(
        articles,
        max_tokens=settings.chunk_max_tokens,
        overlap_tokens=settings.chunk_overlap_tokens,
    )
    for c in chunks:
        c.source_type = SourceType.STANDARD
        c.source_id = standard.standard_id

    embed_client = VertexEmbeddingClient(
        project_id=settings.gcp_project_id,
        region=settings.gcp_region,
        model_name=settings.vertex_embedding_model,
    )
    embedded = embed_chunks(chunks, settings=settings, client=embed_client)
    counts = _build_indexer(settings).index(embedded, source_type=SourceType.STANDARD)

    obligations = [_section_obligation(standard, s) for s in sections]

    payload = {
        "run_id": run_id,
        "kind": "standard",
        "source_id": standard.standard_id,
        "sections": len(sections),
        "chunks": len(chunks),
        "obligations": len(obligations),
        "completed_at": datetime.now(UTC).isoformat(),
        "indexed": counts,
    }
    _publish_update(settings, payload)
    log.info("ingest.standard.done", **payload)
    return payload


# --- Insurance -----------------------------------------------------------

def ingest_insurance(catalog_id: str, *, settings: Settings) -> dict:
    run_id = str(uuid.uuid4())
    log.info("ingest.insurance.start", catalog=catalog_id, run_id=run_id)

    clauses = load_insurance_catalog(catalog_id, settings.data_dir)

    embed_client = VertexEmbeddingClient(
        project_id=settings.gcp_project_id,
        region=settings.gcp_region,
        model_name=settings.vertex_embedding_model,
    )
    vectors = embed_client.embed([c.text for c in clauses]) if clauses else []

    indexer = _build_indexer(settings)
    pg = indexer.upsert_insurance_clauses(catalog_id, clauses, vectors)

    # Vector Search: synthesise EmbeddedChunks so the same upserter handles them.
    vs_count = 0
    if indexer._vs is not None and clauses:
        embedded = [
            EmbeddedChunk(
                chunk_id=f"insurance-{catalog_id}-{c.clause_id}",
                regulation_id=catalog_id,
                article_number=c.clause_id,
                text=c.text,
                token_count=max(1, len(c.text) // 4),
                source_type=SourceType.INSURANCE,
                source_id=catalog_id,
                embedding=v,
            )
            for c, v in zip(clauses, vectors, strict=True)
        ]
        vs_count = indexer._vs.upsert(embedded)

    indexer._graph.write_insurance_clauses(catalog_id, clauses)

    payload = {
        "run_id": run_id,
        "kind": "insurance",
        "source_id": catalog_id,
        "clauses": len(clauses),
        "completed_at": datetime.now(UTC).isoformat(),
        "indexed": {"postgres": pg, "vector_search": vs_count},
    }
    _publish_update(settings, payload)
    log.info("ingest.insurance.done", **payload)
    return payload


# --- Entrypoint ----------------------------------------------------------

def main(argv: list[str] | None = None) -> int:
    settings = get_settings()
    configure_logging(settings.log_level)
    args = _parse_args(argv if argv is not None else sys.argv[1:])

    summary: list[dict] = []

    if args.all:
        for r in REGULATIONS.values():
            summary.append(ingest_regulation(r, settings=settings, skip_extract=args.skip_extract))
        for s in STANDARDS.values():
            summary.append(ingest_standard(s, settings=settings))
        for i in INSURANCE_CATALOGS:
            summary.append(ingest_insurance(i, settings=settings))
    elif args.regulation:
        targets = (
            list(REGULATIONS.values())
            if args.regulation == "all"
            else [get_regulation(args.regulation)]
        )
        for r in targets:
            summary.append(ingest_regulation(r, settings=settings, skip_extract=args.skip_extract))
    elif args.standard:
        targets = (
            list(STANDARDS.values()) if args.standard == "all" else [get_standard(args.standard)]
        )
        for s in targets:
            summary.append(ingest_standard(s, settings=settings))
    elif args.insurance:
        targets = (
            list(INSURANCE_CATALOGS.keys())
            if args.insurance == "all"
            else [get_insurance_catalog(args.insurance).catalog_id]
        )
        for cid in targets:
            summary.append(ingest_insurance(cid, settings=settings))

    print(json.dumps({"summary": summary}, indent=2, default=str))
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
