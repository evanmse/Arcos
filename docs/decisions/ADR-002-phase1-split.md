# ADR-002 — Découpage Phase 1 en 1.a (bootstrap) et 1.b (data)

- **Date** : 2026-04-25
- **Statut** : Accepté

## Décision

Phase 1 splittée en deux livraisons :
- **1.a** : APIs, Artifact Registry, Secret Manager, IAM/WIF (zéro coût récurrent).
- **1.b** : VPC + Cloud SQL + BigQuery + Vector Search + buckets data (coûts récurrents).

Vector Search reste **opt-in** sur prod (`enable_vector_search = false`) tant que la pipeline juridique (Phase 2) n'est pas opérationnelle, pour éviter ~150 €/mois de serving idle.

## Conséquences

- ✅ Permet de valider la WIF et le pipeline CI sans coût.
- ✅ Cloud SQL en IP privée uniquement (pas d'IP publique exposée même temporairement).
- ⚠️ Les indexes Vector Search sont créés mais **non déployés** sur l'endpoint — le déploiement (manuel via gcloud, voir RUNBOOKS) déclenche le coût de serving.
