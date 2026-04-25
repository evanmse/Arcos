# INTEGREAT

Plateforme SaaS B2B de **conformité réglementaire** pour fintechs européennes.

INTEGREAT lit les textes de loi (DORA, MiCA, AI Act, RGPD), les confronte aux outils internes
du client (Jira, Confluence, Drive, GitHub, Slack, Teams) et génère des plans d'action
exportés directement dans le SI.

## Stack (cible)

- **Front** : Next.js 14 (App Router) · TypeScript · shadcn/ui · Clerk
- **API** : FastAPI 0.115 · Python 3.12 · Pydantic v2
- **Agents** : LangGraph 0.2 (multi-agents · human-in-the-loop)
- **LLM** : Vertex AI Gemini 2.x (primaire) · Anthropic Claude Sonnet (fallback)
- **Data** : Cloud SQL Postgres 16 + pgvector · Vertex AI Vector Search · Neo4j Aura · BigQuery (audit)
- **Infra** : GCP `europe-west1` · Terraform · Cloud Run · Artifact Registry · Pub/Sub · Cloud Scheduler
- **CI/CD** : GitHub Actions → Cloud Build → Artifact Registry → Cloud Run (Workload Identity Federation)

## Monorepo

```
integreat/
├── apps/
│   ├── web/                  # Next.js 14
│   ├── api/                  # FastAPI
│   ├── pipeline-legal/       # Cloud Run Job — crawlers juridiques
│   └── pipeline-corporate/   # Cloud Run Job — connecteurs SaaS
├── packages/
│   ├── agents/               # LangGraph (lib Python)
│   ├── shared-types/         # Types partagés TS
│   └── prompts/              # Prompts versionnés
├── infra/terraform/          # IaC (modules + envs dev/prod)
├── .github/workflows/        # CI/CD
└── docs/                     # ARCHITECTURE, ONBOARDING, RUNBOOKS, ADRs
```

## État d'avancement

- [x] **Phase 0** — projets GCP `integreat-dev` + `integreat-prod` créés sous l'org `hasfy.fr`
- [ ] **Phase 1** — Bootstrap infra (en cours)
- [ ] **Phase 2** — Pipeline juridique
- [ ] **Phase 3** — Pipeline corporate + agents LangGraph
- [ ] **Phase 4** — Sécurité & observabilité
- [ ] **Phase 5** — Frontend Next.js

Voir [docs/ONBOARDING.md](docs/ONBOARDING.md) pour démarrer en local.
