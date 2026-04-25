# `@integreat/web`

Next.js 14 + TypeScript app to exercise the INTEGREAT workflow locally without
calling GCP. Reads policies seed from `packages/policies/policies_seed.json`
and risk/insurance JSONs from `apps/pipeline-risk/data/`.

## Pages

- `/` dashboard with stats
- `/policies` Policies Tree (toggle ON/OFF, mandatory protection)
- `/standards` ISO 42001 / ISO 23894 / NIST AI RMF / OWASP LLM Top 10
- `/insurance` Munich Re / Hiscox / AXA XL clauses
- `/evaluate` mock evaluation: GitHub URL -> Trust Score 3D + obligations +
  AI liability coverage recommendation

## API routes

- `GET /api/policies`
- `POST /api/policies/toggle` `{ policy_id, enabled }`
- `GET /api/standards[?id=iso_42001]`
- `GET /api/insurance[?id=munichre]`
- `POST /api/evaluate` `{ github_url, agent_name }` -> `EvaluationResult`

## Run

```bash
cd apps/web
npm install
npm run dev    # http://localhost:3000
npm run typecheck
npm run build
```

## Notes

- Toggle store en memoire (process Node unique). Phase 5 = PoliciesStore
  (Postgres + Redis cache).
- Trust Score = mock deterministe. Phase 5 = LangGraph + gVisor sandbox +
  signature Cloud KMS.
- Vocabulaire: Trust Score / AI Assurance Report / AI liability coverage via
  partenaire assureur agree. Pas "certification".
