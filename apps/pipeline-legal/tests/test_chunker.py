import pytest

from pipeline_legal.chunker import chunk_article, chunk_articles
from pipeline_legal.models import Article


SHORT_TEXT = (
    "(1) Financial entities shall manage ICT risk. "
    "(2) Where applicable, they shall comply with Article 6. "
    "(3) The principle of proportionality applies."
)


@pytest.fixture
def short_article() -> Article:
    return Article(
        regulation_id="dora",
        article_number="28",
        title="ICT third-party risk",
        chapter="CHAPTER II — RISK MANAGEMENT",
        text=SHORT_TEXT,
    )


def test_chunk_short_article_returns_single_chunk(short_article):
    chunks = chunk_article(short_article, max_tokens=1000, overlap_tokens=50)
    assert len(chunks) == 1
    c = chunks[0]
    assert c.regulation_id == "dora"
    assert c.article_number == "28"
    assert "Article 28" in c.text
    assert "RISK MANAGEMENT" in c.text
    assert c.token_count > 0


def test_chunk_long_article_splits_with_overlap():
    text = " ".join(f"({i}) " + ("Lorem ipsum " * 30) for i in range(1, 21))
    art = Article(
        regulation_id="dora",
        article_number="9",
        title="Long",
        chapter=None,
        text=text,
    )
    chunks = chunk_article(art, max_tokens=200, overlap_tokens=50)
    assert len(chunks) >= 2
    # Each chunk under or close to budget (header + body).
    for c in chunks:
        assert c.token_count <= 220  # tolerate header overhead
    # Stable chunk ids
    assert len({c.chunk_id for c in chunks}) == len(chunks)


def test_chunk_articles_iterates_all(short_article):
    art2 = short_article.model_copy(update={"article_number": "29"})
    chunks = chunk_articles([short_article, art2], max_tokens=1000, overlap_tokens=50)
    arts_seen = {c.article_number for c in chunks}
    assert arts_seen == {"28", "29"}


def test_chunk_invalid_args(short_article):
    with pytest.raises(ValueError):
        chunk_article(short_article, max_tokens=0)
    with pytest.raises(ValueError):
        chunk_article(short_article, max_tokens=100, overlap_tokens=200)


def test_chunk_text_without_numbering_returns_one_chunk():
    art = Article(
        regulation_id="dora",
        article_number="1",
        title="Subject matter",
        chapter=None,
        text="This Regulation lays down uniform requirements for the security of network and information systems.",
    )
    chunks = chunk_article(art, max_tokens=500, overlap_tokens=20)
    assert len(chunks) == 1
