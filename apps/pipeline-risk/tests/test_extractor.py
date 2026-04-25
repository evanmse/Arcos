import json

from pipeline_risk.extractor import LLMClient, extract_obligations
from pipeline_risk.models import Article
from pipeline_risk.settings import Settings


VALID_RESPONSE = json.dumps(
    {
        "obligations": [
            {
                "id": "ict-risk-mgmt",
                "regulation_id": "ignored-by-extractor",
                "article_number": "ignored",
                "text": "Financial entities shall manage ICT third-party risk.",
                "applicable_to": ["credit_institution"],
                "sanction": None,
                "deadline": "continuous",
                "domain": ["ICT_RISK", "THIRD_PARTY"],
            },
            {
                "id": "compliance-responsibility",
                "regulation_id": "ignored",
                "article_number": "ignored",
                "text": "Financial entities shall remain fully responsible for compliance.",
                "applicable_to": ["financial_entity"],
                "sanction": None,
                "deadline": None,
                "domain": ["GOVERNANCE"],
            },
        ]
    }
)


class FakeLLM(LLMClient):
    def __init__(self, payload: str) -> None:
        self.payload = payload
        self.calls = 0

    def generate_json(self, *, system: str, user: str) -> str:
        self.calls += 1
        return self.payload


def test_extract_obligations_validates_and_restamps():
    art = Article(
        regulation_id="dora",
        article_number="28",
        title="Test",
        text="dummy text",
    )
    out = extract_obligations(art, settings=Settings(env="test"), client=FakeLLM(VALID_RESPONSE))

    assert len(out) == 2
    assert {o.regulation_id for o in out} == {"dora"}
    assert {o.article_number for o in out} == {"28"}
    assert out[0].id != "ict-risk-mgmt"  # re-hashed
    assert len(out[0].id) == 16
    assert out[0].domain == ["ICT_RISK", "THIRD_PARTY"]


def test_extract_obligations_handles_invalid_json():
    art = Article(regulation_id="dora", article_number="28", text="x")
    out = extract_obligations(art, settings=Settings(env="test"), client=FakeLLM("not-json"))
    assert out == []


def test_extract_obligations_handles_invalid_schema():
    art = Article(regulation_id="dora", article_number="28", text="x")
    out = extract_obligations(
        art,
        settings=Settings(env="test"),
        client=FakeLLM(json.dumps({"obligations": [{"text": "missing fields"}]})),
    )
    assert out == []
