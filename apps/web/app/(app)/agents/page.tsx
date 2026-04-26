import Link from "next/link";

export const metadata = { title: "Agents — INTEGREAT" };

type Agent = {
  id: string;
  name: string;
  type: string;
  trust: number;
  riskClass: "high" | "limited" | "minimal";
  policies: number;
  obligations: number;
  insured: boolean;
  lastEval: string;
  description: string;
};

const AGENTS: Agent[] = [
  {
    id: "atlas",
    name: "Atlas Underwriter",
    type: "Decision · Insurance",
    trust: 84,
    riskClass: "high",
    policies: 7,
    obligations: 23,
    insured: true,
    lastEval: "2d",
    description: "Auto-prices policy quotes for SMB insurance. RAG over historical claims.",
  },
  {
    id: "iris",
    name: "Iris Recruiter",
    type: "Screening · HR",
    trust: 71,
    riskClass: "high",
    policies: 5,
    obligations: 18,
    insured: false,
    lastEval: "1w",
    description: "Pre-screens candidates from CV pool. AI Act Annex III · employment.",
  },
  {
    id: "nova",
    name: "Nova Support Bot",
    type: "Conversational · Customer",
    trust: 92,
    riskClass: "limited",
    policies: 4,
    obligations: 9,
    insured: true,
    lastEval: "3h",
    description: "Tier-1 support agent. Transparency obligations + content moderation.",
  },
  {
    id: "orion",
    name: "Orion Code Reviewer",
    type: "Productivity · Engineering",
    trust: 88,
    riskClass: "minimal",
    policies: 3,
    obligations: 4,
    insured: false,
    lastEval: "12h",
    description: "Reviews PRs against internal style guide. Internal-use only.",
  },
];

const RISK_TONE: Record<string, string> = {
  high: "chip-pink",
  limited: "chip-amber",
  minimal: "chip-emerald",
};

export default function AgentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <div className="pill">deliver · certify · insure</div>
          <h1 className="text-[26px] md:text-[28px] font-semibold tracking-tight mt-2">
            <span className="text-gradient">Agents</span>, reports &amp; coverage
          </h1>
          <p className="text-[13.5px] text-white/55 mt-2 max-w-[680px]">
            Every AI agent gets a continuous trust report, a regulatory certification bundle
            and matched insurance coverage. One click to generate, one click to share.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost !py-2 !px-3.5 text-[12.5px]">
            <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={1.7}>
              <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
            </svg>
            Bulk export
          </button>
          <button className="btn-primary !py-2 !px-3.5 text-[12.5px]">
            <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 5v14M5 12h14" />
            </svg>
            Register agent
          </button>
        </div>
      </header>

      {/* KPI strip */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="card p-4">
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-white/45">Active agents</div>
          <div className="text-[22px] font-semibold tabular mt-1">{AGENTS.length}</div>
        </div>
        <div className="card p-4">
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-white/45">Avg trust score</div>
          <div className="text-[22px] font-semibold tabular mt-1">
            {Math.round(AGENTS.reduce((s, a) => s + a.trust, 0) / AGENTS.length)}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-white/45">Insured</div>
          <div className="text-[22px] font-semibold tabular mt-1">
            {AGENTS.filter((a) => a.insured).length}
            <span className="text-[12px] text-white/40">/{AGENTS.length}</span>
          </div>
        </div>
        <div className="card p-4">
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-white/45">Reports issued</div>
          <div className="text-[22px] font-semibold tabular mt-1">42</div>
        </div>
      </section>

      {/* Agents list */}
      <section className="flex flex-col gap-3">
        {AGENTS.map((a) => (
          <article key={a.id} className="card p-5 flex flex-col lg:flex-row gap-5">
            <div className="lg:w-[44px] flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500 to-sky-400 grid place-items-center text-[14px] font-bold">
                {a.name[0]}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[16px] font-semibold">{a.name}</h3>
                <span className="text-[11.5px] text-white/45">· {a.type}</span>
                <span className={`chip ${RISK_TONE[a.riskClass]}`}>{a.riskClass} risk</span>
                {a.insured ? (
                  <span className="chip chip-emerald">insured</span>
                ) : (
                  <span className="chip chip-amber">no coverage</span>
                )}
              </div>
              <p className="text-[12.5px] text-white/55 mt-1.5 max-w-[700px]">{a.description}</p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[12px]">
                <Stat label="trust" value={`${a.trust}/100`} />
                <Stat label="policies" value={a.policies} />
                <Stat label="obligations" value={a.obligations} />
                <Stat label="last eval" value={a.lastEval} />
              </div>
            </div>
            {/* Trust ring */}
            <div className="flex items-center gap-3">
              <div className="relative h-[64px] w-[64px]">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(${
                      a.trust >= 80 ? "#34d399" : a.trust >= 60 ? "#38bdf8" : "#f472b6"
                    } ${a.trust}%, rgba(255,255,255,0.06) ${a.trust}%)`,
                  }}
                />
                <div className="absolute inset-[5px] rounded-full bg-[#0a0d15] border border-white/[0.08] grid place-items-center">
                  <div className="text-[15px] font-semibold tabular">{a.trust}</div>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <button className="btn-primary !py-1.5 !px-3 text-[11.5px]">
                  <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6M9 13h6M9 17h6" />
                  </svg>
                  PDF report
                </button>
                <button className="btn-ghost !py-1.5 !px-3 text-[11.5px]">
                  <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <path d="M12 15a3 3 0 0 1-3-3V7a3 3 0 0 1 6 0v5a3 3 0 0 1-3 3z" />
                    <path d="M5 11a7 7 0 0 0 14 0M12 18v4" />
                  </svg>
                  Certify
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* Insurance products */}
      <section className="card-elevated p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-white/45">marketplace</div>
            <h2 className="text-[18px] font-semibold mt-0.5">AI liability coverage</h2>
            <p className="text-[12.5px] text-white/55 mt-1 max-w-[600px]">
              Compare coverage products from carriers, mapped to the obligations your agents
              actually trigger. INTEGREAT proves coverage for each clause with citation back to the
              regulation.
            </p>
          </div>
          <Link className="btn-ghost !py-2 !px-3.5 text-[12.5px]" href="/insurance">
            View all clauses →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <InsCard
            name="MunichRe AI Cover"
            tag="enterprise"
            premium="€42 / agent / month"
            limit="€10M aggregate"
            covers={["Cyber & data breach", "Audit defense", "Hallucination liability"]}
            bestFor="High-risk LLM apps in finance"
            tone="violet"
          />
          <InsCard
            name="AIG AlgoShield"
            tag="popular"
            premium="€28 / agent / month"
            limit="€5M aggregate"
            covers={["Bias claims", "GDPR fines", "Reputational harm"]}
            bestFor="Customer-facing AI"
            tone="sky"
          />
          <InsCard
            name="AXA AI Continuum"
            tag="flexible"
            premium="from €12 / agent / month"
            limit="€2M aggregate"
            covers={["Transparency claims", "IP infringement"]}
            bestFor="SMBs starting their AI journey"
            tone="pink"
          />
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.12em] text-white/40">{label}</div>
      <div className="font-semibold tabular text-white/85">{value}</div>
    </div>
  );
}

function InsCard({
  name,
  tag,
  premium,
  limit,
  covers,
  bestFor,
  tone,
}: {
  name: string;
  tag: string;
  premium: string;
  limit: string;
  covers: string[];
  bestFor: string;
  tone: "violet" | "sky" | "pink";
}) {
  return (
    <div className="card p-5 flex flex-col gap-3 relative overflow-hidden">
      <div
        className={`absolute -top-12 -right-12 h-32 w-32 rounded-full bg-${tone}-500/30 blur-2xl pointer-events-none`}
      />
      <div className="relative flex items-center justify-between">
        <span className="text-[15px] font-semibold">{name}</span>
        <span className={`chip chip-${tone}`}>{tag}</span>
      </div>
      <div className="relative">
        <div className="text-[20px] font-semibold tabular">{premium}</div>
        <div className="text-[11.5px] text-white/45 mt-0.5">{limit}</div>
      </div>
      <ul className="relative flex flex-col gap-1.5 text-[12.5px] text-white/70">
        {covers.map((c) => (
          <li key={c} className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" width={12} height={12} stroke="#a7f3d0" strokeWidth={2.5} fill="none">
              <path d="m5 12 5 5L20 7" />
            </svg>
            {c}
          </li>
        ))}
      </ul>
      <div className="relative text-[11.5px] text-white/45 italic mt-1">Best for: {bestFor}</div>
      <button className="relative btn-primary !py-2 !px-3 text-[12px] mt-1">Get quote</button>
    </div>
  );
}
