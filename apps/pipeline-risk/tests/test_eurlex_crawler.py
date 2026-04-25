from datetime import UTC, datetime

from pipeline_risk.crawlers.eurlex import build_eurlex_url, crawl_eurlex
from pipeline_risk.settings import Settings


def test_build_eurlex_url_default():
    url = build_eurlex_url("32022R2554")
    assert url.endswith("/EN/TXT/HTML/?uri=CELEX:32022R2554&from=EN")


def test_build_eurlex_url_lang_fr():
    url = build_eurlex_url("32022R2554", lang="FR")
    assert "/FR/TXT/HTML/" in url
    assert url.endswith("&from=FR")


def test_crawl_eurlex_writes_to_storage(monkeypatch):
    captured: dict = {}

    class FakeWriter:
        def write_bytes(self, bucket, blob_name, data, content_type):
            captured.update(bucket=bucket, blob=blob_name, data=data, ct=content_type)
            return f"gs://{bucket}/{blob_name}"

        def read_bytes(self, bucket, blob_name):
            return None

    def fake_fetch(url, *, timeout, user_agent):
        captured["url"] = url
        return b"<html>hi</html>"

    monkeypatch.setattr("pipeline_risk.crawlers.eurlex._fetch", fake_fetch)

    settings = Settings(env="test", raw_legal_bucket="integreat-test-raw")
    result = crawl_eurlex(
        "32022R2554",
        settings=settings,
        writer=FakeWriter(),
        fetched_at=datetime(2026, 4, 25, tzinfo=UTC),
    )

    assert result.celex == "32022R2554"
    assert result.bytes == len(b"<html>hi</html>")
    assert result.storage_uri.endswith("/eurlex/32022R2554/2026-04-25.html")
    assert captured["bucket"] == "integreat-test-raw"
    assert captured["ct"].startswith("text/html")
