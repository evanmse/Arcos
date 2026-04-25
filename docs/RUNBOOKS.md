# RUNBOOKS — INTEGREAT

## Phase 1.b inventaire — env dev (`integreat-dev`)

| Ressource | Identifiant |
|---|---|
| VPC | `integreat-vpc` |
| Subnet | `integreat-dev-subnet` (10.10.0.0/20, europe-west1) |
| Serverless VPC connector | `integreat-dev-vpcc` (10.20.0.0/28) |
| Cloud SQL | `integreat-dev-pg` — Postgres 16, ZONAL, IP privée |
| Database | `integreat` |
| DB users | `integreat_app`, `integreat_migrator` (mots de passe dans Secret Manager : `pg_app_password`, `pg_migrator_password`) |
| Bucket raw legal | `integreat-dev-raw-legal` |
| Bucket exports | `integreat-dev-exports` |
| Bucket VS staging | `integreat-dev-vs-staging` |
| BigQuery audit | `integreat-dev.integreat_audit.audit_log` (partitionné jour, clusterisé tenant_id) |
| Vector Search endpoint | `integreat-dev-endpoint` |
| Vector Search index legal | `integreat_risk_dev` |
| Vector Search index corp | `integreat_corp_dev` |

## Connexion Cloud SQL en local

```bash
# Cloud SQL Auth Proxy (recommandé, IAM)
gcloud auth application-default login
cloud-sql-proxy --port 5432 \
  integreat-dev:europe-west1:integreat-dev-pg

# Récupérer le mot de passe applicatif
gcloud secrets versions access latest \
  --secret=pg_app_password --project=integreat-dev
```

## Vector Search — déploiement d'un index

Les indexes sont créés mais **non déployés** (le déploiement génère le coût ~150€/mois).

```bash
INDEX=$(gcloud ai indexes list --region=europe-west1 \
  --project=integreat-dev --format='value(name)' \
  --filter='displayName=integreat_risk_dev')

ENDPOINT=$(gcloud ai index-endpoints list --region=europe-west1 \
  --project=integreat-dev --format='value(name)' \
  --filter='displayName=integreat-dev-endpoint')

gcloud ai index-endpoints deploy-index "$ENDPOINT" \
  --deployed-index-id=integreat_risk_dev_v1 \
  --display-name=integreat_risk_dev_v1 \
  --index="$INDEX" \
  --region=europe-west1 \
  --project=integreat-dev
```

## BigQuery audit — sample insert

```sql
INSERT INTO `integreat-dev.integreat_audit.audit_log`
(event_id, event_time, tenant_id, actor_type, action, schema_version)
VALUES (GENERATE_UUID(), CURRENT_TIMESTAMP(), 'demo', 'system', 'audit.smoke_test', 'v1');
```

## Rotation secrets (Phase 4)

À implémenter via Cloud Function + Cloud Scheduler 90j. En attendant, rotation manuelle :

```bash
gcloud secrets versions add anthropic_api_key \
  --data-file=- --project=integreat-dev <<< "$NEW_KEY"
```

## Incident — Cloud SQL down

1. Vérifier `gcloud sql instances describe integreat-dev-pg --project=integreat-dev`.
2. Logs : Cloud Logging → resource.type="cloudsql_database".
3. Failover (prod uniquement, REGIONAL) : `gcloud sql instances failover integreat-prod-pg --project=integreat-prod`.
4. Restore backup : voir backups dans console Cloud SQL → Restore.
