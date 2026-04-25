"""Gemini-powered obligations extractor.

Given a legal article, asks Gemini 2.x to return a strict JSON document of
atomic obligations, validated against ``ObligationExtractionResult``.
"""
from __future__ import annotations

import hashlib
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Protocol

from pydantic import ValidationError

from pipeline_risk.logging_setup import get_logger
from pipeline_risk.models import (
    Article,
    Obligation,
    ObligationExtractionResult,
    RiskCategory,
    RiskDimension,
)
from pipeline_risk.settings import Settings

log = get_logger(__name__)


# Loose-to-strict mapping for LLM hallucinations on enum fields. Synonyms
# regularly produced by Gemini that we coerce into the strict enum values.
_RISK_CATEGORY_ALIASES: dict[str, RiskCategory] = {
    # Existing values
    **{rc.value: rc for rc in RiskCategory},
    # Common synonyms produced by the LLM
    "technical": RiskCategory.SECURITY,
    "technical_requirements": RiskCategory.SECURITY,
    "accuracy": RiskCategory.HALLUCINATION,
    "robustness": RiskCategory.SECURITY,
    "resilience": RiskCategory.ICT_RISK,
    "explainability": RiskCategory.TRANSPARENCY,
    "data_governance": RiskCategory.DATA_PROTECTION,
    "data_quality": RiskCategory.DATA_PROTECTION,
    "risk_management": RiskCategory.AI_GOVERNANCE,
    "lifecycle_management": RiskCategory.AI_GOVERNANCE,
    "governance": RiskCategory.AI_GOVERNANCE,
    "reporting": RiskCategory.AUDIT,
    "compliance": RiskCategory.AUDIT,
    "legal": RiskCategory.AUDIT,
    "fairness": RiskCategory.BIAS,
    "discrimination": RiskCategory.BIAS,
    "privacy": RiskCategory.DATA_PROTECTION,
    "supply_chain": RiskCategory.THIRD_PARTY,
    "vendor": RiskCategory.THIRD_PARTY,
    "monitoring": RiskCategory.HUMAN_OVERSIGHT,
    "oversight": RiskCategory.HUMAN_OVERSIGHT,
    "ethics": RiskCategory.ETHICAL_SOCIAL,
    "social": RiskCategory.ETHICAL_SOCIAL,
    "cybersecurity": RiskCategory.SECURITY,
}

_DIMENSION_ALIASES: dict[str, RiskDimension] = {
    **{rd.value: rd for rd in RiskDimension},
    "tech": RiskDimension.TECHNICAL,
    "operational": RiskDimension.TECHNICAL,
    "legal_compliance": RiskDimension.LEGAL,
    "compliance": RiskDimension.LEGAL,
    "regulatory": RiskDimension.LEGAL,
    "ethics": RiskDimension.ETHICAL_SOCIAL,
    "ethical": RiskDimension.ETHICAL_SOCIAL,
    "social": RiskDimension.ETHICAL_SOCIAL,
    "fin": RiskDimension.FINANCIAL,
    "money": RiskDimension.FINANCIAL,
    "market": RiskDimension.ECONOMIC,
}


def _normalize_obligation(raw: dict) -> dict:
    """Coerce LLM enum strings into the strict allowed values, drop unknown ones."""
    cats = raw.get("risk_categories") or []
    norm_cats: list[str] = []
    seen: set[str] = set()
    for c in cats:
        if not isinstance(c, str):
            continue
        key = c.strip().lower().replace("-", "_").replace(" ", "_")
        mapped = _RISK_CATEGORY_ALIASES.get(key)
        if mapped and mapped.value not in seen:
            norm_cats.append(mapped.value)
            seen.add(mapped.value)
    if not norm_cats:
        norm_cats = [RiskCategory.AI_GOVERNANCE.value]
    raw["risk_categories"] = norm_cats

    dim = raw.get("dimension")
    if isinstance(dim, str):
        key = dim.strip().lower().replace("-", "_").replace(" ", "_")
        mapped_dim = _DIMENSION_ALIASES.get(key, RiskDimension.LEGAL)
        raw["dimension"] = mapped_dim.value
    else:
        raw["dimension"] = RiskDimension.LEGAL.value
    return raw


SYSTEM_PROMPT = """You are a risk analyst specialised in EU financial and AI regulations.
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
      "domain": ["<one or more of: ICT_RISK, GOVERNANCE, INCIDENT, RESILIENCE, THIRD_PARTY, AUDIT, REPORTING, CRYPTO, AI, DATA_PROTECTION>"],
      "risk_categories": ["<STRICTLY one or more of: ict_risk, ai_governance, bias, transparency, human_oversight, data_protection, third_party, incident, audit, security, prompt_injection, jailbreak, hallucination, ethical_social>"],
      "dimension": "<STRICTLY one of: technical, legal, ethical_social, financial, economic>"
    }
  ]
}

Rules:
- Output JSON ONLY, no prose, no markdown, no code fences.
- Maximum 15 obligations per article.
- Use null (not empty string) for unknown sanction/deadline.
- Never invent obligations not present in the text.
- Always include risk_categories (>=1) and dimension (exactly one).
- DO NOT invent new enum values; use ONLY the listed risk_categories and dimension values.
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
        text=article.text[:8000],
    )

    raw = client.generate_json(system=SYSTEM_PROMPT, user=user_prompt)

    try:
        data = json.loads(raw)
        # Normalise enum-like fields before strict pydantic validation.
        for o in data.get("obligations", []):
            _normalize_obligation(o)
        parsed = ObligationExtractionResult.model_validate(data)
    except (json.JSONDecodeError, ValidationError) as exc:
        log.error(
            "obligation.extract.invalid",
            regulation=article.regulation_id,
            article=article.article_number,
            error=str(exc),
        )
        return []

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


def extract_obligations_parallel(
    articles: list[Article],
    *,
    settings: Settings,
    client: LLMClient | None = None,
    max_workers: int = 8,
) -> list[Obligation]:
    """Extract obligations from many articles in parallel.

    Gemini calls are I/O bound (network + remote inference), so a thread pool
    yields a near-linear speed-up up to the API quota. Order is preserved.
    """
    client = client or VertexGeminiClient(
        project_id=settings.gcp_project_id,
        region=settings.gcp_region,
        model_name=settings.vertex_llm_model,
    )
    results: dict[int, list[Obligation]] = {}
    with ThreadPoolExecutor(max_workers=max_workers) as ex:
        futures = {
            ex.submit(extract_obligations, art, settings=settings, client=client): idx
            for idx, art in enumerate(articles)
        }
        for fut in as_completed(futures):
            idx = futures[fut]
            try:
                results[idx] = fut.result()
            except Exception as exc:  # noqa: BLE001
                log.error("obligation.extract.failed", idx=idx, error=str(exc))
                results[idx] = []
    out: list[Obligation] = []
    for i in range(len(articles)):
        out.extend(results.get(i, []))
    return out
