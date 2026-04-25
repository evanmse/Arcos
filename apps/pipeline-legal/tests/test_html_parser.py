from pipeline_legal.parsers.html_parser import parse_eurlex_html
from tests.fixtures.sample_eurlex import SAMPLE_HTML


def test_parse_eurlex_extracts_articles():
    articles = parse_eurlex_html(SAMPLE_HTML, regulation_id="dora")
    numbers = [a.article_number for a in articles]
    assert numbers == ["28", "29", "30"]


def test_parse_eurlex_attaches_chapter():
    articles = parse_eurlex_html(SAMPLE_HTML, regulation_id="dora")
    by_num = {a.article_number: a for a in articles}
    assert "RISK MANAGEMENT" in (by_num["28"].chapter or "")
    assert "INCIDENT REPORTING" in (by_num["30"].chapter or "")


def test_parse_eurlex_extracts_citations():
    articles = parse_eurlex_html(SAMPLE_HTML, regulation_id="dora")
    by_num = {a.article_number: a for a in articles}
    assert "art.6(1)" in by_num["28"].citations
    assert "art.28(4)" in by_num["29"].citations


def test_parse_eurlex_handles_empty_html():
    assert parse_eurlex_html(b"<html></html>", regulation_id="x") == []


def test_parse_eurlex_text_non_empty():
    articles = parse_eurlex_html(SAMPLE_HTML, regulation_id="dora")
    for a in articles:
        assert len(a.text) > 50
