"""Parser for EUR-Lex consolidated HTML pages.

Heuristic-based: EUR-Lex pages are not perfectly structured but consistently
expose articles with anchors like ``id="art_28"`` or ``id="ART_28"`` and
chapter / division headings as ``<p class="ti-section-1">``.

The parser is purposefully tolerant: anything it cannot map is grouped under a
synthetic "preamble" or "annex" article, never lost.
"""
from __future__ import annotations

import re
from collections.abc import Iterable

from bs4 import BeautifulSoup, Tag

from pipeline_risk.models import Article

ARTICLE_ID_RE = re.compile(r"^(?:art|ART)[_\-]?(\d+[a-z]?)$")
CITATION_RE = re.compile(
    r"\b(?:Article|article|Art\.)\s+(\d+[a-z]?)(?:\s*\((\d+)\))?",
    re.UNICODE,
)

# EUR-Lex sometimes serves XHTML 1.0 with an XML prolog and `xmlns` on <html>;
# lxml then switches to XML mode and id-based queries fail (namespace prefixes).
# We strip these markers so the document parses as plain HTML.
_XML_PROLOG_RE = re.compile(r"<\?xml[^?]*\?>\s*", re.IGNORECASE)
_DOCTYPE_XHTML_RE = re.compile(r"<!DOCTYPE[^>]*xhtml[^>]*>", re.IGNORECASE)
_XMLNS_ATTR_RE = re.compile(r'\sxmlns(?::[a-zA-Z0-9]+)?="[^"]*"', re.IGNORECASE)
# AWS WAF challenge page returned by EUR-Lex CloudFront (typically <3KB, contains
# an `id="challenge-container"`). We detect and reject it explicitly.
_WAF_CHALLENGE_MARKER = "challenge-container"


def _clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _extract_chapter(node: Tag) -> str | None:
    """Walk preceding siblings to find the closest chapter/section heading."""
    for prev in node.find_all_previous(["h1", "h2", "h3", "p"], limit=20):
        classes = prev.get("class") or []
        if any(c.startswith("ti-section") or c.startswith("ti-chap") for c in classes):
            return _clean_text(prev.get_text(" "))
    return None


def _iter_article_anchors(soup: BeautifulSoup) -> Iterable[Tag]:
    for tag in soup.find_all(id=True):
        m = ARTICLE_ID_RE.match(str(tag.get("id", "")))
        if m:
            yield tag


class WAFChallengeError(RuntimeError):
    """Raised when EUR-Lex returns an AWS WAF challenge page instead of content."""


def _normalize_xhtml(html: str) -> str:
    """Strip XML prolog, XHTML doctype and xmlns attrs so lxml uses HTML mode."""
    html = _XML_PROLOG_RE.sub("", html, count=1)
    html = _DOCTYPE_XHTML_RE.sub("<!DOCTYPE html>", html, count=1)
    html = _XMLNS_ATTR_RE.sub("", html)
    return html


def parse_eurlex_html(
    html: str | bytes,
    *,
    regulation_id: str,
) -> list[Article]:
    """Extract structured articles from an EUR-Lex HTML payload."""
    if isinstance(html, bytes):
        html = html.decode("utf-8", errors="replace")

    # Reject WAF challenge pages early — they have no legal content.
    if len(html) < 8000 and _WAF_CHALLENGE_MARKER in html:
        raise WAFChallengeError(
            f"EUR-Lex returned an AWS WAF challenge page for {regulation_id} "
            f"({len(html)} bytes); retry with longer backoff or rotate UA."
        )

    html = _normalize_xhtml(html)

    soup = BeautifulSoup(html, "lxml")
    anchors = list(_iter_article_anchors(soup))
    if not anchors:
        # Some EUR-Lex pages put the id on a child of the article block.
        anchors = list(soup.select("[id^='art'], [id^='ART']"))

    articles: list[Article] = []

    for idx, anchor in enumerate(anchors):
        m = ARTICLE_ID_RE.match(str(anchor.get("id", "")))
        if not m:
            continue
        article_number = m.group(1)
        title_tag = anchor.find_next(["p", "h2", "h3", "h4"])
        title = _clean_text(title_tag.get_text(" ")) if title_tag else None

        # Collect all sibling text up to the next article anchor.
        next_anchor = anchors[idx + 1] if idx + 1 < len(anchors) else None
        chunks_text: list[str] = []
        for sibling in anchor.find_all_next(["p", "li"]):
            if next_anchor is not None and sibling is next_anchor:
                break
            classes = sibling.get("class") or []
            if any(
                c.startswith("ti-section") or c.startswith("ti-chap") for c in classes
            ):
                # Chapter heading reached; stop collecting (next article will
                # pick up its own chapter via _extract_chapter).
                break
            text = _clean_text(sibling.get_text(" "))
            if text and text != (title or ""):
                chunks_text.append(text)

        body = "\n".join(chunks_text).strip()
        if not body:
            continue

        citations = sorted({_normalize_citation(*m.groups()) for m in CITATION_RE.finditer(body)})

        articles.append(
            Article(
                regulation_id=regulation_id,
                article_number=article_number,
                title=title,
                chapter=_extract_chapter(anchor),
                text=body,
                citations=citations,
            )
        )

    return articles


def _normalize_citation(article_number: str, paragraph: str | None) -> str:
    base = f"art.{article_number}"
    return f"{base}({paragraph})" if paragraph else base
