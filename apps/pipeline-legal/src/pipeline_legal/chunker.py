"""Chunker for legal articles.

Strategy: split each article by paragraph (numbered enumeration "1." / "(1)"),
then pack paragraphs into chunks of at most ``max_tokens`` tokens with a small
overlap of ``overlap_tokens`` tokens carried over from the previous chunk to
preserve cross-paragraph context.

Token counting uses tiktoken (cl100k base), which is a reasonable proxy for the
Vertex AI text-embedding-004 tokenizer (it slightly overestimates and that is
the safe direction).
"""
from __future__ import annotations

import hashlib
import re
from collections.abc import Iterable

import tiktoken

from pipeline_legal.models import Article, Chunk

PARAGRAPH_SPLIT_RE = re.compile(r"(?:^|\s)(?:\((\d+)\)|(\d+)\.)\s+")

_ENC = tiktoken.get_encoding("cl100k_base")


def _count_tokens(text: str) -> int:
    return len(_ENC.encode(text))


def _split_paragraphs(text: str) -> list[tuple[str | None, str]]:
    """Return a list of (paragraph_number, body) tuples.

    If no enumeration is found, the whole text is returned as a single
    paragraph with paragraph_number=None.
    """
    matches = list(PARAGRAPH_SPLIT_RE.finditer(text))
    if not matches:
        return [(None, text.strip())]

    out: list[tuple[str | None, str]] = []
    # Material before the first numbered paragraph (introductory sentence).
    head = text[: matches[0].start()].strip()
    if head:
        out.append((None, head))

    for i, m in enumerate(matches):
        number = m.group(1) or m.group(2)
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        body = text[start:end].strip()
        if body:
            out.append((number, body))
    return out


def _chunk_id(regulation_id: str, article_number: str, idx: int) -> str:
    raw = f"{regulation_id}|{article_number}|{idx}".encode()
    return hashlib.sha1(raw).hexdigest()[:24]


def chunk_article(
    article: Article,
    *,
    max_tokens: int = 1000,
    overlap_tokens: int = 100,
) -> list[Chunk]:
    """Pack the paragraphs of an article into chunks under ``max_tokens``."""
    if max_tokens <= 0:
        raise ValueError("max_tokens must be positive")
    if overlap_tokens < 0 or overlap_tokens >= max_tokens:
        raise ValueError("0 <= overlap_tokens < max_tokens required")

    paragraphs = _split_paragraphs(article.text)
    if not paragraphs:
        return []

    context_header = _build_header(article)
    header_tokens = _count_tokens(context_header)
    budget = max_tokens - header_tokens
    if budget <= 0:
        # Header alone exceeds budget — emit a single truncated chunk to keep
        # downstream code happy.
        return [
            Chunk(
                chunk_id=_chunk_id(article.regulation_id, article.article_number, 0),
                regulation_id=article.regulation_id,
                article_number=article.article_number,
                paragraph_number=None,
                chapter=article.chapter,
                text=context_header,
                token_count=header_tokens,
            )
        ]

    chunks: list[Chunk] = []
    buffer: list[tuple[str | None, str]] = []
    buffer_tokens = 0
    overlap_carry: list[tuple[str | None, str]] = []

    def flush() -> None:
        nonlocal buffer, buffer_tokens, overlap_carry
        if not buffer:
            return
        text = _render_chunk(context_header, buffer)
        chunks.append(
            Chunk(
                chunk_id=_chunk_id(article.regulation_id, article.article_number, len(chunks)),
                regulation_id=article.regulation_id,
                article_number=article.article_number,
                paragraph_number=buffer[0][0],
                chapter=article.chapter,
                text=text,
                token_count=_count_tokens(text),
            )
        )
        overlap_carry = _take_tail(buffer, overlap_tokens)
        buffer = []
        buffer_tokens = 0

    for para in paragraphs:
        para_tokens = _count_tokens(para[1])
        if para_tokens > budget:
            # Paragraph itself larger than budget → emit any buffered content
            # then split the paragraph by sentences.
            flush()
            for sub_chunk in _split_long_paragraph(para, budget):
                buffer = list(overlap_carry) + [sub_chunk]
                buffer_tokens = sum(_count_tokens(p[1]) for p in buffer)
                flush()
            continue

        # Carry overlap if buffer is empty.
        if not buffer and overlap_carry:
            buffer.extend(overlap_carry)
            buffer_tokens = sum(_count_tokens(p[1]) for p in buffer)
            overlap_carry = []

        if buffer_tokens + para_tokens > budget:
            flush()
            if overlap_carry:
                buffer.extend(overlap_carry)
                buffer_tokens = sum(_count_tokens(p[1]) for p in buffer)
                overlap_carry = []

        buffer.append(para)
        buffer_tokens += para_tokens

    flush()
    return chunks


def chunk_articles(
    articles: Iterable[Article],
    *,
    max_tokens: int = 1000,
    overlap_tokens: int = 100,
) -> list[Chunk]:
    out: list[Chunk] = []
    for article in articles:
        out.extend(chunk_article(article, max_tokens=max_tokens, overlap_tokens=overlap_tokens))
    return out


def _build_header(article: Article) -> str:
    parts: list[str] = []
    if article.chapter:
        parts.append(f"[{article.chapter}]")
    parts.append(f"Article {article.article_number}")
    if article.title:
        parts.append(f"— {article.title}")
    return " ".join(parts)


def _render_chunk(header: str, paragraphs: list[tuple[str | None, str]]) -> str:
    body_lines: list[str] = []
    for number, text in paragraphs:
        body_lines.append(f"{number}. {text}" if number else text)
    return f"{header}\n" + "\n".join(body_lines)


def _take_tail(
    paragraphs: list[tuple[str | None, str]], overlap_tokens: int
) -> list[tuple[str | None, str]]:
    if overlap_tokens <= 0 or not paragraphs:
        return []
    out: list[tuple[str | None, str]] = []
    total = 0
    for para in reversed(paragraphs):
        tokens = _count_tokens(para[1])
        if total + tokens > overlap_tokens and out:
            break
        out.insert(0, para)
        total += tokens
    return out


def _split_long_paragraph(
    paragraph: tuple[str | None, str], budget: int
) -> list[tuple[str | None, str]]:
    """Sentence-split a paragraph that exceeds the per-chunk budget."""
    number, body = paragraph
    sentences = re.split(r"(?<=[.!?])\s+", body)
    pieces: list[tuple[str | None, str]] = []
    current: list[str] = []
    current_tokens = 0
    for sentence in sentences:
        tokens = _count_tokens(sentence)
        if current and current_tokens + tokens > budget:
            pieces.append((number, " ".join(current)))
            current = [sentence]
            current_tokens = tokens
        else:
            current.append(sentence)
            current_tokens += tokens
    if current:
        pieces.append((number, " ".join(current)))
    return pieces
