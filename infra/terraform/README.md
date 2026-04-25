# Infra Terraform — INTEGREAT

État stocké dans GCS :
- dev : `gs://integreat-dev-tf-state/envs/dev`
- prod : `gs://integreat-prod-tf-state/envs/prod`

## Phase 1.a — bootstrap (en cours)

Provisionne sur chaque projet :

- Activation des APIs GCP (Cloud Run, Vertex AI, Cloud SQL, Pub/Sub, BigQuery, Storage, Artifact Registry, Secret Manager, DLP, KMS, etc.)
- Artifact Registry Docker `integreat-docker` dans `europe-west1`
- Secret Manager : 11 secrets vides (à remplir hors-Terraform)
- Workload Identity Federation pour GitHub Actions (`evanmse/integreat`)
- Service account `gha-deployer` avec rôles minimaux Cloud Run / Build / AR / Storage

## Usage

```bash
# Pré-requis : gcloud auth login + ADC, terraform >= 1.9
cd infra/terraform/envs/dev
terraform init
terraform plan
terraform apply
```

## À venir (Phase 1.b)

- VPC `integreat-vpc` + Serverless VPC Connector
- Cloud SQL Postgres 16 + pgvector
- Vertex AI Vector Search (`integreat_risk`, `integreat_corp`)
- Buckets données (`integreat-raw-legal`, `integreat-exports`)
- Dataset BigQuery `integreat_audit`
