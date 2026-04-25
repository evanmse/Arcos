# Onboarding INTEGREAT

> Objectif : nouveau dev opérationnel en moins de 30 minutes.

## Pré-requis

| Outil | Version mini | Install macOS |
|---|---|---|
| Python | 3.12 | `brew install python@3.12` |
| Node | 20 LTS | `brew install node@20` |
| pnpm | 9+ | `brew install pnpm` |
| Docker Desktop | dernier | `brew install --cask docker` |
| gcloud CLI | dernier | `brew install --cask google-cloud-sdk` |
| Terraform | 1.9+ | `brew install terraform` |
| GitHub CLI | dernier | `brew install gh` |

## 1. Cloner le repo

```bash
git clone git@github.com:evanmse/integreat.git
cd integreat
```

## 2. Authentification GCP

```bash
gcloud auth login
gcloud auth application-default login
gcloud auth application-default set-quota-project integreat-dev
gcloud config set project integreat-dev
```

## 3. Stack locale (à venir Phase 1.b)

```bash
docker compose -f docker-compose.dev.yml up -d
# Postgres 16 + Neo4j 5 + Langfuse local
```

## 4. Infrastructure dev (lecture seule par défaut)

```bash
cd infra/terraform/envs/dev
terraform init
terraform plan   # doit afficher "No changes"
```

## 5. État courant du projet

| Brique | État |
|---|---|
| GCP projects | `integreat-dev` + `integreat-prod` créés sous org `hasfy.fr` |
| Terraform state | GCS `integreat-dev-tf-state` / `integreat-prod-tf-state` (versioning ON) |
| Artifact Registry | `europe-west1-docker.pkg.dev/integreat-dev/integreat-docker` |
| Secret Manager | 11 secrets vides provisionnés |
| WIF | `github-pool/github-provider` configuré pour `evanmse/integreat` |
| Cloud SQL / VPC / Vector Search | ⏳ Phase 1.b |
| Pipelines / Agents / Front | ⏳ Phases 2-5 |

## 6. Conventions

- Commits : `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
- Une PR par phase.
- ADRs sous `docs/decisions/ADR-XXX.md`.
