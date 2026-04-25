# ADR-001 — Création des projets GCP sous l'organisation hasfy.fr

- **Date** : 2026-04-25
- **Statut** : Accepté
- **Décision** : créer `integreat-dev` (dev) et `integreat-prod` (prod) sous l'organisation existante `hasfy.fr` (ID 539039137516), région principale `europe-west1`.

## Contexte

Le prompt technique imposait `integreat-dev` / `integreat-prod`. L'ID `integreat-dev` est globalement réservé sur GCP, fallback `integreat-dev`. Une organisation Cloud Identity `hasfy.fr` existait déjà sur le compte `contact@hasfy.fr` ; nous l'utilisons plutôt qu'un mode standalone — cela débloque IAM org-level, VPC-SC, policies, et facilite la mise en conformité SOC 2 / ISO 27001.

## Conséquences

- ✅ Permet `roles/orgpolicy.policyAdmin`, contraintes de localisation EU, future VPC Service Controls.
- ✅ Billing centralisé (`01D195-147335-12CFAD`).
- ⚠️ Tous les futurs scripts doivent utiliser `integreat-dev` (et non `integreat-dev`).
- ⚠️ Le job `deploy-prod.yml` contient un placeholder `PROD_PROJECT_NUMBER` à remplacer après le premier `terraform apply` prod.
