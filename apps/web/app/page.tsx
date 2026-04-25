import Link from "next/link";
import { loadPolicies } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const policies = await loadPolicies();
  const mandatory = policies.filter((p) => p.mandatory).length;
  const stats = [
    { label: "Policies seed", value: policies.length },
    { label: "Policies mandatory", value: mandatory },
    { label: "Standards", value: 4 },
    { label: "Insurance partners", value: 3 },
    { label: "Risk categories", value: 13 },
    { label: "Regulations EU", value: 4 },
  ];

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold">Workflow INTEGREAT</h1>
        <p className="mt-2 text-white/60 max-w-2xl">
          Cette UI locale exerce les briques Phase 2 — Risk &amp; Insurance
          Knowledge Graph + Policies Tree — sans appeler GCP. Elle permet de
          dérouler le scénario : configurer les policies → évaluer un agent IA
          → obtenir Trust Score 3D + recommandation d&apos;AI liability
          coverage.
        </p>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-white/10 bg-white/5 p-4"
          >
            <div className="text-xs uppercase text-white/40">{s.label}</div>
            <div className="text-2xl font-semibold mt-1">{s.value}</div>
          </div>
        ))}
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <Link
          href="/policies"
          className="block rounded-lg border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition"
        >
          <div className="font-semibold">1 · Configurer le Policies Tree</div>
          <p className="text-sm text-white/60 mt-1">
            Activer / désactiver les policies AI Act, DORA, RGPD, ISO 42001,
            NIST AI RMF, OWASP LLM. Les obligatoires ne peuvent pas être
            désactivées.
          </p>
        </Link>
        <Link
          href="/evaluate"
          className="block rounded-lg border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition"
        >
          <div className="font-semibold">2 · Évaluer un agent IA</div>
          <p className="text-sm text-white/60 mt-1">
            Soumettre un repo GitHub fictif → Trust Score 3D + obligations
            mappées + matching avec Munich Re / Hiscox / AXA XL.
          </p>
        </Link>
        <Link
          href="/standards"
          className="block rounded-lg border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition"
        >
          <div className="font-semibold">3 · Explorer les standards</div>
          <p className="text-sm text-white/60 mt-1">
            ISO 42001, ISO 23894, NIST AI RMF, OWASP LLM Top 10 — sections
            indexées dans le Risk Graph.
          </p>
        </Link>
        <Link
          href="/insurance"
          className="block rounded-lg border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition"
        >
          <div className="font-semibold">4 · Catalogues assurance</div>
          <p className="text-sm text-white/60 mt-1">
            Clauses coverage / exclusion / condition de chaque partenaire
            assureur agréé.
          </p>
        </Link>
      </section>
    </div>
  );
}
