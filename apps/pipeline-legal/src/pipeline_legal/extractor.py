"""Gemini-powered obligations extractor.

Given a legal article, asks Gemini 2.x to return a strict JSON document of
atomic obligations, validated against ``ObligationExtractionResult``.
"""
from __future__ import annotations

import hashlib
import json
from typing import Protocol

from pydantic import ValidationError

from pipeline_legal.logging_setup import get_logger
from pipeline_legal.models import (
    Article,
    Obligation,
    ObligationExtractionResult,
)
from pipeline_legal.settings import Settings

log = get_logger(__name__)


SYSTEM_PROMPT = """You are a legal analyst specialised in EU financial regulations.
Your task: extract ATOMIC obligations from a single regulatory article.

An "atomic obligation" is one verifiable normative requirement (one MUST, SHOULD or SHALL).
Decompose conjunctions ("X and Y") into separate obligations.

Return a JSON object that strictly matches this schema:
{
  "obligations": [
    {
      "id": "<short slug, e.g. 'risk-mgmt-framework'>",
      "regulation_id": "<as provided>",
      "article_number": "<as provided>",
      "text": "<single normative sentence in English>",
      "applicable_to": ["<entity types, e.g. credit_institution, payment_institution>"],
      "sanction": "<sanction summary or null>",
      "deadline": "<ISO date or 'continuous' or null>",
      "domain": ["<one or more of: ICT_RISK, GOVERNANCE, INCIDENT, RESILIENCE, THIRD_PARTY, AUDIT, REPORTING, CRYPTO, AI, DATA_PROTECTION>"]
    }
  ]
}

Rules:
- Output JSON ONLY, no prose, no markdown, no code fences.
- Maximum 15 obligations per article.
- Use null (not empty string) for unknown sanction/deadline.
- Never invent obligations not present in the text.
"""


USER_TEMPLATE = """Regulation: {regulation_id}
Article: {article_number}
Title: {title}
Chapter: {chapter}

Text:
\"\"\"{text}\"\"\"
"""


class LLMClient(Protocol):
    def generate_json(self, *, system: str, user: str) -> str: ...


class VertexGeminiClient:
    """Concrete Gemini client (vertexai SDK)."""

    def __init__(self, *, project_id: str, region: str, model_name: str) -> None:
        import vertexai
        from vertexai.generative_models import GenerationConfig, GenerativeModel

        vertexai.init(project=project_id, location=region)
        self._model = GenerativeModel(
            model_name,
            generation_config=GenerationConfig(
                temperature=0.0,
                response_mime_type="application/json",
            ),
        )

    def generate_json(self, *, system: str, user: str) -> str:
        response = self._model.generate_content([system, user])
        return response.text


def _stable_obligation_id(regulation_id: str, article_number: str, slug: str) -> str:
    raw = f"{regulation_id}|{article_number}|{slug}".encode()
    return hashlib.sha1(raw).hexdigest()[:16]


def extract_obligations(
    article: Article,
    *,
    settings: Settings,
    client: LLMClient | None = None,
) -> list[Obligation]:
    """Run the extraction prompt and return validated Pydantic obligations."""
    client = client or VertexGeminiClient(
        project_id=settings.gcp_project_id,
        region=settings.gcp_region,
        model_name=settings.vertex_llm_model,
    )

    user_prompt = USER_TEMPLATE.format(
        regulation_id=article.regulation_id,
        article_number=article.article_number,
        title=article.title or "",
        chapter=article.chapter or "",
        text=article.text[:8000],  # safety cap
    )

    raw = client.generate_json(system=SYSTEM_PROMPT, user=user_prompt)

    try:
        parsed = ObligationExtractionResult.model_validate(json.loads(raw))
    except (json.JSONDecodeError, ValidationError) as exc:
        log.error(
            "obligation.extract.invalid",
            regulation=article.regulation_id,
            article=article.article_number,
            error=str(exc),
        )
        return []

    # Re-stamp ids with deterministic hashes to make the pipeline idempotent.
    for o in parsed.obligations:
        o.regulation_id = article.regulation_id
        o.article_number = article.article_number
        o.id = _stable_obligation_id(article.regulation_id, article.article_number, o.id)

    log.info(
        "obligation.extract.ok",
        regulation=article.regulation_id,
        article=article.article_number,
        count=len(parsed.obligations),
    )
    return parsed.obligations
