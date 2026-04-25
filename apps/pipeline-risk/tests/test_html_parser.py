from pipeline_risk.parsers.html_parser import (
    WAFChallengeError,
    parse_eurlex_html,
)
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


def test_parse_eurlex_handles_xhtml_prolog_and_xmlns():
    """EUR-Lex sometimes serves XHTML 1.0 with an XML prolog and xmlns on <html>.

    The parser must strip these so lxml stays in HTML mode and id queries work.
    """
    xhtml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" '
        '"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\n'
        '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">'
        + SAMPLE_HTML[len("<html>") :]
    )
    articles = parse_eurlex_html(xhtml, regulation_id="dora")
    assert [a.article_number for a in articles] == ["28", "29", "30"]


def test_parse_eurlex_rejects_waf_challenge():
    waf_html = (
        '<!DOCTYPE html><html><body>'
        '<div id="challenge-container"></div>'
        '<script>window.awsWafCookieDomainList = [];</script>'
        '</body></html>'
    )
    import pytest

    with pytest.raises(WAFChallengeError):
        parse_eurlex_html(waf_html, regulation_id="ai_act")
