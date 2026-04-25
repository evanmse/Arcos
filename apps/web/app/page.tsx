import Link from "next/link";
import { loadPolicies } from "@/lib/data";
import { listRegulations, loadStats, type Stats } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const FEATURES = [
  {
    title: "Risk knowledge graph",
    body:
      "EU regulations (AI Act, DORA, MiCA, RGPD) ingested article by article. Each obligation is atomic, embedded, and queryable through Vector Search.",
    icon: GraphIcon,
  },
  {
    title: "AI agent trust score",
    body:
      "Multi-dimensional score (technical, legal, ethical-social) computed against the obligations applicable to your agent's domain and risk class.",
    icon: ShieldIcon,
  },
  {
    title: "Insurance-grade reporting",
    body:
      "Match the agent's residual risks against partner insurer catalogs (Munich Re, Hiscox, AXA XL) and produce an AI Liability Cover proposal.",
    icon: SparkIcon,
  },
];

export default async function HomePage() {
  const policies = await loadPolicies().catch(() => []);
  const mandatory = policies.filter((p) => p.mandatory).length;

  let stats: Stats = {
    regulations: 0,
    standards: 4,
    insurance_clauses: 0,
    chunks: 0,
    obligations: 0,
  };
  let regulations: Awaited<ReturnType<typeof listRegulations>> = [];
  try {
    [stats, regulations] = await Promise.all([loadStats(), listRegulations()]);
  } catch {
    // DB unreachable in local dev — render with seed-only stats.
  }

  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="relative isolate overflow-hidden rounded-3xl border border-white/[0.08] glass">
        <div className="aurora" />
        <div className="relative px-8 py-16 md:px-14 md:py-24">
          <div className="pill">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            Live · {regulations.length || stats.regulations || 4} regulations indexed
          </div>
          <h1 className="mt-6 max-w-3xl text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
            <span className="text-gradient">Trust infrastructure</span>
            <br />
            for autonomous AI agents.
          </h1>
          <p className="mt-6 max-w-2xl text-[15px] leading-7 text-white/65">
            Integreat maps every AI agent against the live corpus of EU regulations, AI standards
            and insurance catalogs — producing an auditable trust score and an underwriting-ready
            liability report.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/evaluate" className="btn-primary">
              Evaluate an agent
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
            <Link href="/regulations" className="btn-ghost">
              Browse regulations
            </Link>
          </div>

          <div className="mt-14 grid grid-cols-2 md:grid-cols-5 gap-3 max-w-4xl">
            <Stat label="Regulations" value={stats.regulations || 4} />
            <Stat label="Risk chunks" value={stats.chunks} />
            <Stat label="Obligations" value={stats.obligations} />
            <Stat label="Standards" value={stats.standards} />
            <Stat label="Policies seeded" value={policies.length} hint={`${mandatory} mandatory`} />
          </div>
        </div>
      </section>

      {/* Pipeline / what it does */}
      <section>
        <SectionTitle pill="01 · capability" title="What Integreat does" />
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <article key={f.title} className="glass glass-hover rounded-2xl p-6">
              <f.icon />
              <div className="mt-5 text-base font-semibold tracking-tight">{f.title}</div>
              <p className="mt-2 text-[13.5px] leading-6 text-white/60">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Regulations snapshot */}
      <section>
        <div className="flex items-end justify-between">
          <SectionTitle pill="02 · corpus" title="Live regulation corpus" />
          <Link href="/regulations" className="text-[13px] text-white/60 hover:text-white">
            See all →
          </Link>
        </div>
        <div className="mt-8 grid md:grid-cols-2 gap-3">
          {(regulations.length ? regulations : FALLBACK_REGS).slice(0, 4).map((r) => (
            <Link
              key={r.regulation_id}
              href={`/regulations/${r.regulation_id}`}
              className="glass glass-hover rounded-2xl p-5 group"
            >
              <div className="flex items-center justify-between">
                <span className="pill">{r.celex || r.regulation_id}</span>
                <span className="text-[11px] font-mono text-white/40">{r.lang || "en"}</span>
              </div>
              <div className="mt-3 text-[15px] font-medium tracking-tight">{r.short_name}</div>
              <div className="mt-1 text-[13px] text-white/55 line-clamp-2">{r.title}</div>
              <div className="mt-4 flex items-center gap-2 text-[12px] text-white/40 group-hover:text-white/70 transition">
                Open file
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Workflow steps */}
      <section>
        <SectionTitle pill="03 · workflow" title="From source to score in four steps" />
        <ol className="mt-8 grid md:grid-cols-4 gap-3">
          {WORKFLOW.map((w, i) => (
            <li key={w.title} className="glass rounded-2xl p-5 relative">
              <div className="absolute -top-3 left-5 h-6 w-6 rounded-md bg-gradient-to-br from-violet-500 to-sky-400 grid place-items-center text-[11px] font-mono font-semibold text-white">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="mt-3 text-[14px] font-semibold tracking-tight">{w.title}</div>
              <p className="mt-2 text-[13px] leading-5 text-white/55">{w.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="text-[10px] uppercase tracking-[0.08em] text-white/40">{label}</div>
      <div className="mt-2 text-2xl font-semibold tabular">{value.toLocaleString()}</div>
      {hint && <div className="mt-0.5 text-[11px] text-white/35">{hint}</div>}
    </div>
  );
}

function SectionTitle({ pill, title }: { pill: string; title: string }) {
  return (
    <div>
      <span className="pill">{pill}</span>
      <h2 className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight">{title}</h2>
    </div>
  );
}

const WORKFLOW = [
  { title: "Crawl", body: "EUR-Lex Cellar XHTML pulled and persisted to GCS, parsed into atomic articles." },
  { title: "Embed", body: "Vertex AI text-embedding-005 generates 768-d vectors, stored in pgvector + Vector Search." },
  { title: "Extract", body: "Gemini 2.5 Flash decomposes each article into atomic obligations with risk metadata." },
  { title: "Score", body: "Agent policies matched against obligations → 3-dimensional trust score + insurer match." },
];

const FALLBACK_REGS = [
  { regulation_id: "ai_act", celex: "32024R1689", short_name: "EU AI Act", title: "Regulation laying down harmonised rules on artificial intelligence", lang: "en" },
  { regulation_id: "dora", celex: "32022R2554", short_name: "DORA", title: "Digital Operational Resilience Act for the financial sector", lang: "en" },
  { regulation_id: "mica", celex: "32023R1114", short_name: "MiCA", title: "Markets in Crypto-Assets Regulation", lang: "en" },
  { regulation_id: "rgpd", celex: "32016R0679", short_name: "GDPR", title: "General Data Protection Regulation", lang: "en" },
];

function GraphIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden className="text-violet-300">
      <circle cx="6" cy="6" r="2.2" />
      <circle cx="18" cy="6" r="2.2" />
      <circle cx="12" cy="18" r="2.2" />
      <path d="M7.5 7.5l3 8.5M16.5 7.5l-3 8.5M8 6h8" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden className="text-sky-300">
      <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
function SparkIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden className="text-pink-300">
      <path d="M12 3v6M12 15v6M3 12h6M15 12h6M5.5 5.5l4 4M14.5 14.5l4 4M18.5 5.5l-4 4M9.5 14.5l-4 4" />
    </svg>
  );
}
