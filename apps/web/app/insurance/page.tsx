import { INSURANCE_PARTNERS, loadInsuranceCatalog } from "@/lib/data";

export const dynamic = "force-dynamic";

const TYPE_COLORS: Record<string, string> = {
  coverage: "bg-emerald-500/20 text-emerald-300",
  exclusion: "bg-red-500/20 text-red-300",
  condition: "bg-amber-500/20 text-amber-300",
  deductible: "bg-sky-500/20 text-sky-300",
  limit: "bg-purple-500/20 text-purple-300",
};

export default async function InsurancePage() {
  const catalogs = await Promise.all(
    INSURANCE_PARTNERS.map(async (p) => ({
      ...p,
      clauses: await loadInsuranceCatalog(p.id),
    })),
  );
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Catalogues assurance</h1>
        <p className="text-sm text-white/60 mt-1">
          Mocks JSON locaux — partenaires Munich Re / Hiscox / AXA XL. La
          recommandation finale (AI liability coverage via partenaire assureur
          agréé) est calculée à l&apos;étape Evaluate.
        </p>
      </div>
      <div className="grid gap-4">
        {catalogs.map((c) => (
          <div
            key={c.id}
            className="rounded-lg border border-white/10 bg-white/5"
          >
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <div className="font-semibold">{c.name}</div>
              <span className="text-xs text-white/40">
                {c.clauses.length} clauses
              </span>
            </div>
            <ul className="divide-y divide-white/5">
              {c.clauses.map((cl) => (
                <li key={cl.clause_id} className="px-4 py-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-white/10">
                      {cl.clause_id}
                    </span>
                    <span
                      className={`text-[10px] uppercase px-1.5 py-0.5 rounded ${TYPE_COLORS[cl.clause_type]}`}
                    >
                      {cl.clause_type}
                    </span>
                    <span className="font-medium">{cl.title}</span>
                    {cl.min_trust_score != null && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                        Trust ≥ {cl.min_trust_score}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white/70 mt-2">{cl.text}</p>
                  {cl.applicable_risk_categories.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {cl.applicable_risk_categories.map((rc) => (
                        <span
                          key={rc}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/60"
                        >
                          {rc}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
