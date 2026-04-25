# RUNBOOKS — ARCOS

## Phase 1.b inventaire — env dev (`arcos-hasfy-dev`)

| Ressource | Identifiant |
|---|---|
| VPC | `arcos-vpc` |
| Subnet | `arcos-dev-subnet` (10.10.0.0/20, europe-west1) |
| Serverless VPC connector | `arcos-dev-vpcc` (10.20.0.0/28) |
| Cloud SQL | `arcos-dev-pg` — Postgres 16, ZONAL, IP privée |
| Database | `arcos` |
| DB users | `arcos_app`, `arcos_migrator` (mots de passe dans Secret Manager : `pg_app_password`, `pg_migrator_password`) |
| Bucket raw legal | `arcos-dev-raw-legal` |
| Bucket exports | `arcos-dev-exports` |
| Bucket VS staging | `arcos-dev-vs-staging` |
| BigQuery audit | `arcos-hasfy-dev.arcos_audit.audit_log` (partitionné jour, clusterisé tenant_id) |
| Vector Search endpoint | `arcos-dev-endpoint` |
| Vector Search index legal | `arcos_legal_dev` |
| Vector Search index corp | `arcos_corp_dev` |

## Connexion Cloud SQL en local

```bash
# Cloud SQL Auth Proxy (recommandé, IAM)
gcloud auth application-default login
cloud-sql-proxy --port 5432 \
  arcos-hasfy-dev:europe-west1:arcos-dev-pg

# Récupérer le mot de passe applicatif
gcloud secrets versions access latest \
  --secret=pg_app_password --project=arcos-hasfy-dev
```

## Vector Search — déploiement d'un index

Les indexes sont créés mais **non déployés** (le déploiement génère le coût ~150€/mois).

```bash
INDEX=$(gcloud ai indexes list --region=europe-west1 \
  --project=arcos-hasfy-dev --format='value(name)' \
  --filter='displayName=arcos_legal_dev')

ENDPOINT=$(gcloud ai index-endpoints list --region=europe-west1 \
  --project=arcos-hasfy-dev --format='value(name)' \
  --filter='displayName=arcos-dev-endpoint')

gcloud ai index-endpoints deploy-index "$ENDPOINT" \
  --deployed-index-id=arcos_legal_dev_v1 \
  --display-name=arcos_legal_dev_v1 \
  --index="$INDEX" \
  --region=europe-west1 \
  --project=arcos-hasfy-dev
```

## BigQuery audit — sample insert

```sql
INSERT INTO `arcos-hasfy-dev.arcos_audit.audit_log`
(event_id, event_time, tenant_id, actor_type, action, schema_version)
VALUES (GENERATE_UUID(), CURRENT_TIMESTAMP(), 'demo', 'system', 'audit.smoke_test', 'v1');
```

## Rotation secrets (Phase 4)

À implémenter via Cloud Function + Cloud Scheduler 90j. En attendant, rotation manuelle :

```bash
gcloud secrets versions add anthropic_api_key \
  --data-file=- --project=arcos-hasfy-dev <<< "$NEW_KEY"
```

## Incident — Cloud SQL down

1. Vérifier `gcloud sql instances describe arcos-dev-pg --project=arcos-hasfy-dev`.
2. Logs : Cloud Logging → resource.type="cloudsql_database".
3. Failover (prod uniquement, REGIONAL) : `gcloud sql instances failover arcos-prod-pg --project=arcos-prod`.
4. Restore backup : voir backups dans console Cloud SQL → Restore.
