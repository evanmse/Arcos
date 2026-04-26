# Atlas Underwriter

Automated SMB insurance underwriter agent. Auto-prices policy quotes given the company's
identity, sector and 5-year claims history. Falls back to a human underwriter for quotes above
€250k annual premium.

## Risk profile

- **EU AI Act risk class**: high (Annex III · access to essential services + financial pricing)
- **Sector**: insurance / financial services
- **Personal data**: none (operates on business entities only)
- **Human oversight**: mandatory above €250k

## Mapped regulatory obligations

- AI Act Art. 14 — human oversight on high-risk decisions
- AI Act Art. 13 — transparency / explainability of decisions
- DORA Art. 28 — third-party ICT risk on the pricing model provider
- MiCA — N/A (no crypto component)
- GDPR — N/A (B2B, no personal data)

## Files

- `agent.yaml` — declarative agent metadata
- `prompts/system.md` — system prompt
- `tests/golden.jsonl` — golden test cases for regression testing
