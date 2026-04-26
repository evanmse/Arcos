<div align="center">

# INTEGREAT

### La conformité réglementaire des fintechs européennes, pilotée par des agents IA.

**INTEGREAT** lit les textes de loi (DORA, MiCA, AI Act, RGPD…), les confronte aux outils internes du client (Jira, Confluence, Drive, GitHub, Slack, Teams) et génère des plans d'action exportés directement dans le SI — du citation-level au ticket Jira.

[Demo live](https://integreat-web-218125131564.europe-west1.run.app) · [Architecture](docs/ARCHITECTURE.md) · [Onboarding](docs/ONBOARDING.md) · [Runbooks](docs/RUNBOOKS.md)

</div>

---

## Pourquoi INTEGREAT

Une banque européenne moyenne dépense **3 à 7 M€ / an** en conformité, traque manuellement des centaines de pages réglementaires et finit par envoyer 20 % de ses obligations en retard. Les solutions existantes sont des PDF-readers déguisés.

**INTEGREAT** transforme la conformité en pipeline continu :

| | Ancien monde | INTEGREAT |
| --- | --- | --- |
| **Veille** | Newsletter, lecture manuelle | Crawl + chunking + embeddings sur tous les textes UE |
| **Évaluation** | Excel, copier-coller | Agents LangGraph confrontent texte ↔ contrôles internes |
| **Plan d'action** | Slide PowerPoint | Tickets Jira, MR GitHub, événements Slack — auto-créés |
| **Audit** | Tableur, captures d'écran | Trace immuable, signée, exportable BigQuery |

> _« Du citation-level au ticket Jira en 90 secondes — avec l'humain dans la boucle là où il compte. »_

---

## Le produit en 30 secondes

1. **Connect.** Connectez Jira, Confluence, Drive, GitHub, Slack, Teams via OAuth.
2. **Ingest.** Les pipelines `pipeline-legal` (crawlers juridiques) et `pipeline-corporate` (connecteurs SaaS) alimentent la base vectorielle et le graphe de connaissance.
3. **Reason.** Les agents LangGraph (Researcher, Mapper, Auditor, Reviewer) confrontent les obligations aux contrôles existants.
4. **Act.** Plan d'action exporté : tickets Jira, PRs GitHub, runbooks Confluence — chaque ligne sourcée à l'article de loi.
5. **Prove.** Rapport exécutif PDF, audit trail BigQuery, attestation de conformité.

---

## Stack (cible)

| Couche | Tech |
| --- | --- |
| **Front** | Next.js 14 (App Router) · TypeScript · shadcn/ui · Clerk |
| **API** | FastAPI 0.115 · Python 3.12 · Pydantic v2 |
| **Agents** | LangGraph 0.2 — multi-agents, human-in-the-loop |
| **LLM** | Vertex AI Gemini 2.x (primaire) · Anthropic Claude Sonnet (fallback) |
| **Data** | Cloud SQL Postgres 16 + pgvector · Vertex AI Vector Search · Neo4j Aura · BigQuery (audit) |
| **Infra** | GCP `europe-west1` · Terraform · Cloud Run · Artifact Registry · Pub/Sub · Cloud Scheduler |
| **CI/CD** | GitHub Actions → Cloud Build → Artifact Registry → Cloud Run (Workload Identity Federation) |

---

## Monorepo

```text
integreat/
├── apps/
│   ├── web/                  # Next.js 14 — UI conformité
│   ├── api/                  # FastAPI — endpoints applicatifs
│   ├── pipeline-legal/       # Cloud Run Job — crawlers juridiques (DORA, MiCA, AI Act, RGPD)
│   └── pipeline-corporate/   # Cloud Run Job — connecteurs SaaS (Jira, Confluence, Drive, GitHub, Slack, Teams)
├── packages/
│   ├── agents/               # LangGraph (lib Python) — Researcher · Mapper · Auditor · Reviewer
│   ├── shared-types/         # Types partagés TypeScript
│   └── prompts/              # Prompts versionnés (avec evals)
├── infra/terraform/          # IaC — modules + envs dev / prod
├── .github/workflows/        # CI/CD GitHub Actions
└── docs/                     # ARCHITECTURE · ONBOARDING · RUNBOOKS · ADRs
```

---

## Démarrage rapide

```bash
# 1. Cloner
git clone git@github.com:hasfy/integreat.git && cd integreat

# 2. Pré-requis
#   - Node 20+, pnpm 9+
#   - Python 3.12, uv
#   - gcloud CLI authentifié sur integreat-dev
#   - terraform 1.7+

# 3. Bootstrapper
pnpm install
uv sync --all-packages

# 4. Lancer en local
pnpm --filter web dev          # http://localhost:3000
uv run --package api uvicorn integreat.api:app --reload --port 8000
```

Voir [docs/ONBOARDING.md](docs/ONBOARDING.md) pour la configuration complète (secrets, accès GCP, OAuth providers).

---

## État d'avancement

| Phase | Périmètre | État |
| :-: | --- | :-: |
| **0** | Projets GCP `integreat-dev` + `integreat-prod` créés sous l'org `hasfy.fr` | ✅ |
| **1** | Bootstrap infra — Terraform, Cloud SQL + pgvector, Artifact Registry, WIF | 🚧 |
| **2** | Pipeline juridique — crawlers DORA / MiCA / AI Act / RGPD, ingestion + embeddings | ⏳ |
| **3** | Pipeline corporate + agents LangGraph (Researcher · Mapper · Auditor · Reviewer) | ⏳ |
| **4** | Sécurité & observabilité — IAM, audit trail BigQuery, SLOs Cloud Monitoring | ⏳ |
| **5** | Frontend Next.js — dashboard, plans d'action, exports Jira | ⏳ |

---

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — diagrammes, flux de données, choix techniques
- [`docs/ONBOARDING.md`](docs/ONBOARDING.md) — démarrer en local, accès GCP, secrets
- [`docs/RUNBOOKS.md`](docs/RUNBOOKS.md) — incidents, déploiements, restores
- [`docs/adr/`](docs/adr/) — Architectural Decision Records

---

## Conformité & sécurité

- **Hébergement UE** — toutes les ressources GCP en `europe-west1`, aucun transfert hors UE.
- **Workload Identity Federation** — zéro clé de service en dépôt.
- **Audit immuable** — chaque action agent loggée dans BigQuery (rétention 7 ans).
- **Secrets** — Google Secret Manager, rotation automatique.
- **Human-in-the-loop** — toute action sortante (ticket, MR, message) passe par un point de validation humain configurable.

---

<div align="center">

Conçu pour les fintechs européennes — par [hasfy.fr](https://hasfy.fr)

</div>
