<div align="center">

# INTEGREAT

### Regulatory compliance for European fintechs, run by AI agents.

**INTEGREAT** ingests regulatory texts (DORA, MiCA, AI Act, GDPR…), confronts them with the customer's internal tooling (Jira, Confluence, Drive, GitHub, Slack, Teams) and ships actionable remediation plans straight into the SI — from citation-level evidence to a Jira ticket.

[Live demo](https://integreat-web-218125131564.europe-west1.run.app) · [Architecture](docs/ARCHITECTURE.md) · [Onboarding](docs/ONBOARDING.md) · [Runbooks](docs/RUNBOOKS.md)

</div>

---

## Why INTEGREAT

A mid-size European bank spends **€3–7M / year** on compliance, manually tracks hundreds of pages of regulation and still ships 20 % of its obligations late. Existing tools are dressed-up PDF readers.

**INTEGREAT** turns compliance into a continuous pipeline:

| | Old world | INTEGREAT |
| --- | --- | --- |
| **Watch** | Newsletters, manual reading | Crawl + chunking + embeddings on every EU text |
| **Assess** | Excel, copy-paste | LangGraph agents map text ↔ internal controls |
| **Plan** | PowerPoint deck | Jira tickets, GitHub MRs, Slack events — auto-created |
| **Audit** | Spreadsheets, screenshots | Immutable, signed trace, exportable to BigQuery |

> _"From citation-level evidence to a Jira ticket in 90 seconds — with the human in the loop where it matters."_

---

## The product in 30 seconds

1. **Connect.** Wire up Jira, Confluence, Drive, GitHub, Slack, Teams over OAuth.
2. **Ingest.** The `pipeline-legal` (legal crawlers) and `pipeline-corporate` (SaaS connectors) jobs feed the vector store and the knowledge graph.
3. **Reason.** LangGraph agents (Researcher, Mapper, Auditor, Reviewer) confront obligations against existing controls.
4. **Act.** Action plan exported: Jira tickets, GitHub PRs, Confluence runbooks — every line sourced down to the article of law.
5. **Prove.** Executive PDF report, BigQuery audit trail, compliance attestation.

---

## Stack (target)

| Layer | Tech |
| --- | --- |
| **Frontend** | Next.js 14 (App Router) · TypeScript · shadcn/ui · Clerk |
| **API** | FastAPI 0.115 · Python 3.12 · Pydantic v2 |
| **Agents** | LangGraph 0.2 — multi-agent, human-in-the-loop |
| **LLM** | Vertex AI Gemini 2.x (primary) · Anthropic Claude Sonnet (fallback) |
| **Data** | Cloud SQL Postgres 16 + pgvector · Vertex AI Vector Search · Neo4j Aura · BigQuery (audit) |
| **Infra** | GCP `europe-west1` · Terraform · Cloud Run · Artifact Registry · Pub/Sub · Cloud Scheduler |
| **CI/CD** | GitHub Actions → Cloud Build → Artifact Registry → Cloud Run (Workload Identity Federation) |

---

## Monorepo

```text
integreat/
├── apps/
│   ├── web/                  # Next.js 14 — compliance UI
│   ├── api/                  # FastAPI — application endpoints
│   ├── pipeline-legal/       # Cloud Run Job — legal crawlers (DORA, MiCA, AI Act, GDPR)
│   └── pipeline-corporate/   # Cloud Run Job — SaaS connectors (Jira, Confluence, Drive, GitHub, Slack, Teams)
├── packages/
│   ├── agents/               # LangGraph (Python lib) — Researcher · Mapper · Auditor · Reviewer
│   ├── shared-types/         # Shared TypeScript types
│   └── prompts/              # Versioned prompts (with evals)
├── infra/terraform/          # IaC — modules + dev / prod envs
├── .github/workflows/        # GitHub Actions CI/CD
└── docs/                     # ARCHITECTURE · ONBOARDING · RUNBOOKS · ADRs
```

---

## Quick start

```bash
# 1. Clone
git clone git@github.com:hasfy/integreat.git && cd integreat

# 2. Prerequisites
#   - Node 20+, pnpm 9+
#   - Python 3.12, uv
#   - gcloud CLI authenticated against integreat-dev
#   - terraform 1.7+

# 3. Bootstrap
pnpm install
uv sync --all-packages

# 4. Run locally
pnpm --filter web dev          # http://localhost:3000
uv run --package api uvicorn integreat.api:app --reload --port 8000
```

See [docs/ONBOARDING.md](docs/ONBOARDING.md) for the full setup (secrets, GCP access, OAuth providers).

---

## Roadmap

| Phase | Scope | Status |
| :-: | --- | :-: |
| **0** | GCP projects `integreat-dev` + `integreat-prod` under `hasfy.fr` org | ✅ |
| **1** | Infra bootstrap — Terraform, Cloud SQL + pgvector, Artifact Registry, WIF | 🚧 |
| **2** | Legal pipeline — DORA / MiCA / AI Act / GDPR crawlers, ingest + embeddings | ⏳ |
| **3** | Corporate pipeline + LangGraph agents (Researcher · Mapper · Auditor · Reviewer) | ⏳ |
| **4** | Security & observability — IAM, BigQuery audit trail, Cloud Monitoring SLOs | ⏳ |
| **5** | Next.js frontend — dashboard, action plans, Jira exports | ⏳ |

---

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — diagrams, data flows, technical choices
- [`docs/ONBOARDING.md`](docs/ONBOARDING.md) — local dev, GCP access, secrets
- [`docs/RUNBOOKS.md`](docs/RUNBOOKS.md) — incidents, deployments, restores
- [`docs/adr/`](docs/adr/) — Architectural Decision Records

---

## Compliance & security

- **EU-only hosting** — every GCP resource pinned to `europe-west1`, no transfer outside the EU.
- **Workload Identity Federation** — zero service-account keys in the repo.
- **Immutable audit** — every agent action logged to BigQuery (7-year retention).
- **Secrets** — Google Secret Manager, automated rotation.
- **Human-in-the-loop** — every outbound action (ticket, MR, message) goes through a configurable human checkpoint.

---

<div align="center">

Built for European fintechs — by [hasfy.fr](https://hasfy.fr)

</div>
