import Link from "next/link";

export const metadata = { title: "INTEGREAT — Trust infrastructure for AI agents" };

export default function LandingPage() {
  return (
    <div className="grid-backdrop relative min-h-screen text-[#e7eaf3]">
      <Header />
      <main className="relative z-10">
        <Hero />
        <PipelinesStrip />
        <FintechUseCases />
        <ThreePipelines />
        <Architecture />
        <FeatureMatrix />
        <Compliance />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#07090f]/70 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6 py-3.5 flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 via-sky-400 to-pink-400 text-[12px] font-bold text-white shadow-lg shadow-violet-500/30">
            I
          </span>
          <span className="text-[15px]">INTEGREAT</span>
        </Link>
        <nav className="ml-2 hidden md:flex gap-1 text-[13px] text-white/60">
          <a href="#pipelines" className="rounded-md px-3 py-1.5 hover:bg-white/[0.05] hover:text-white transition">
            Pipelines
          </a>
          <a href="#usecases" className="rounded-md px-3 py-1.5 hover:bg-white/[0.05] hover:text-white transition">
            Use cases
          </a>
          <a href="#architecture" className="rounded-md px-3 py-1.5 hover:bg-white/[0.05] hover:text-white transition">
            Architecture
          </a>
          <a href="#features" className="rounded-md px-3 py-1.5 hover:bg-white/[0.05] hover:text-white transition">
            Features
          </a>
          <a href="#compliance" className="rounded-md px-3 py-1.5 hover:bg-white/[0.05] hover:text-white transition">
            Compliance
          </a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <a
            href="https://github.com/evanmse/integreat"
            className="btn-ghost"
            target="_blank"
            rel="noreferrer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.92.58.1.79-.25.79-.56 0-.27-.01-1.16-.02-2.1-3.2.7-3.87-1.36-3.87-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.24 3.34.95.1-.74.4-1.24.73-1.53-2.55-.29-5.24-1.27-5.24-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17a10.96 10.96 0 0 1 5.74 0c2.19-1.48 3.15-1.17 3.15-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.4-2.69 5.36-5.25 5.65.41.35.78 1.05.78 2.12 0 1.53-.01 2.76-.01 3.13 0 .31.21.67.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
            </svg>
            Source
          </a>
          <Link href="/login" className="btn-ghost">
            Sign in
          </Link>
          <Link href="/dashboard" className="btn-primary">
            Open app
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="aurora absolute -inset-20 opacity-70" />
      <div className="relative mx-auto max-w-7xl px-6 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="flex flex-col items-center text-center">
          <span className="pill">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
            Trust infrastructure for AI agents · live on EU AI Act
          </span>
          <h1 className="mt-6 text-[44px] md:text-[64px] leading-[1.05] font-semibold tracking-tight max-w-[920px]">
            Make every AI agent <span className="text-gradient">auditable, certifiable & insurable</span>.
          </h1>
          <p className="mt-5 text-[15px] md:text-[16.5px] text-white/60 max-w-[680px]">
            INTEGREAT runs three coordinated pipelines — risk knowledge, agent evaluation and
            insurance matching — to turn EU regulations and your enterprise data into a live trust
            score, regulatory reports and AI liability coverage.
          </p>
          <div className="mt-8 flex flex-wrap gap-2 justify-center">
            <Link href="/dashboard" className="btn-primary !py-2.5 !px-4 text-[13.5px]">
              Launch dashboard
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
            <a href="#pipelines" className="btn-ghost !py-2.5 !px-4 text-[13.5px]">
              How it works
            </a>
          </div>

          {/* live preview window */}
          <div className="relative mt-16 w-full max-w-[1080px]">
            <div className="glow-border card-elevated rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.06] bg-white/[0.02]">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
                </div>
                <div className="ml-3 text-[11px] font-mono text-white/40">
                  app.integreat.ai/dashboard
                </div>
                <span className="ml-auto chip chip-emerald">live</span>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
                <PreviewKpi label="Trust score" big="78" sub="+4 pts last 7 days" tone="violet" />
                <PreviewKpi label="Obligations indexed" big="2 421" sub="113 articles · ai_act" tone="sky" />
                <PreviewKpi label="Agents certified" big="4/7" sub="3 pending insurance" tone="pink" />
                <div className="md:col-span-3 card p-4">
                  <div className="text-[10.5px] uppercase tracking-[0.14em] text-white/45 mb-2">
                    Active pipelines
                  </div>
                  {[
                    { n: "risk-knowledge · ai_act", d: "✓ ingested · 2421 chunks", p: 100 },
                    { n: "risk-knowledge · dora", d: "running · extracting obligations", p: 62 },
                    { n: "agent-evaluation · atlas", d: "running · RAG against AI Act", p: 38 },
                  ].map((r) => (
                    <div key={r.n} className="flex items-center gap-3 py-1.5 text-[12px]">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          r.p === 100 ? "bg-emerald-400" : "bg-sky-400 animate-pulse"
                        }`}
                      />
                      <span className="font-mono text-white/75 w-[260px] truncate">{r.n}</span>
                      <span className="text-white/45 flex-1 truncate">{r.d}</span>
                      <span className="tabular text-white/55 w-12 text-right">{r.p}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PreviewKpi({ label, big, sub, tone }: { label: string; big: string; sub: string; tone: string }) {
  return (
    <div className="card p-4 relative overflow-hidden">
      <div className={`absolute -top-12 -right-12 h-32 w-32 rounded-full bg-${tone}-500/30 blur-2xl`} />
      <div className="relative">
        <div className="text-[10.5px] uppercase tracking-[0.14em] text-white/45">{label}</div>
        <div className="text-[28px] font-semibold tabular mt-1">{big}</div>
        <div className="text-[11.5px] text-white/45 mt-0.5">{sub}</div>
      </div>
    </div>
  );
}

function PipelinesStrip() {
  return (
    <section className="border-y border-white/[0.06] bg-white/[0.015]">
      <div className="mx-auto max-w-7xl px-6 py-6 flex flex-wrap items-center justify-between gap-4 text-[12px] text-white/45">
        <span className="uppercase tracking-[0.18em]">Built on</span>
        <span className="font-mono">Cloud Run · europe-west1</span>
        <span className="font-mono">Vertex AI · gemini-2.5-flash</span>
        <span className="font-mono">text-embedding-005 · 768d</span>
        <span className="font-mono">Cloud SQL · pgvector</span>
        <span className="font-mono">Vertex Vector Search</span>
        <span className="font-mono">EUR-Lex Cellar</span>
      </div>
    </section>
  );
}

function ThreePipelines() {
  const pipelines = [
    {
      tag: "01 · risk-knowledge",
      title: "Regulatory ingestion",
      tone: "violet",
      desc: "Crawls EUR-Lex Cellar in real time, chunks each article at 512 tokens, embeds with Vertex text-embedding-005 and decomposes obligations with Gemini 2.5 Flash. Outputs a queryable corpus + vector index.",
      bullets: [
        "AI Act, DORA, MiCA, GDPR + ISO/NIST standards",
        "FK-safe upserts, parallel extraction (8 workers)",
        "Enum normalization recovers 40 % more obligations",
      ],
      cta: { href: "/regulations", label: "Browse the corpus" },
    },
    {
      tag: "02 · risk-scoring",
      title: "Agent evaluation",
      tone: "sky",
      desc: "Takes a Policy JSON for any AI agent, performs RAG against your regulatory corpus, scores each obligation and produces a continuous trust score with proof citations.",
      bullets: [
        "Sandbox runner for behavioral tests",
        "Dimension-by-dimension scoring (transparency, bias…)",
        "Trust score writer → BigQuery audit log",
      ],
      cta: { href: "/agents", label: "See agent reports" },
    },
    {
      tag: "03 · risk-coverage",
      title: "Insurance matching",
      tone: "pink",
      desc: "Maps your agents’ residual risks to clauses from MunichRe, AIG, AXA AI products. Generates quote-ready evidence packs that show exactly which obligation is covered by which clause.",
      bullets: [
        "Catalog of AI liability products",
        "Evidence pack with citations to the regulation",
        "PDF certification + machine-readable manifest",
      ],
      cta: { href: "/agents", label: "Get coverage" },
    },
  ];
  return (
    <section id="pipelines" className="mx-auto max-w-7xl px-6 py-24">
      <div className="text-center max-w-[640px] mx-auto">
        <span className="pill">three pipelines · one trust score</span>
        <h2 className="mt-5 text-[34px] md:text-[42px] font-semibold tracking-tight">
          From <span className="text-gradient">regulation</span> to{" "}
          <span className="text-gradient">insurance</span>, automated.
        </h2>
        <p className="mt-3 text-[14.5px] text-white/55">
          Three coordinated services, one purpose: turn opaque AI risk into a measurable, certifiable
          asset.
        </p>
      </div>
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {pipelines.map((p) => (
          <article key={p.tag} className="card p-6 flex flex-col gap-4 relative overflow-hidden">
            <div
              className={`absolute -top-16 -right-16 h-44 w-44 rounded-full bg-${p.tone}-500/25 blur-3xl pointer-events-none`}
            />
            <div className="relative">
              <div className={`text-[10.5px] font-mono uppercase tracking-[0.16em] text-white/45`}>
                {p.tag}
              </div>
              <h3 className="text-[20px] font-semibold tracking-tight mt-2">{p.title}</h3>
              <p className="text-[13.5px] text-white/55 mt-2">{p.desc}</p>
              <ul className="mt-4 flex flex-col gap-1.5 text-[13px] text-white/75">
                {p.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <svg viewBox="0 0 24 24" width={13} height={13} stroke="#a7f3d0" strokeWidth={2.4} fill="none" className="mt-1 shrink-0">
                      <path d="m5 12 5 5L20 7" />
                    </svg>
                    {b}
                  </li>
                ))}
              </ul>
              <Link href={p.cta.href} className="btn-ghost !py-1.5 !px-3 text-[12.5px] mt-5 w-fit">
                {p.cta.label} →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function FintechUseCases() {
  const cases = [
    {
      tag: "Tier-1 banks",
      regulation: "DORA",
      title: "ICT risk & third-party resilience for retail banking",
      pain: "Critical ICT providers, register-of-information reporting, incident classification — all manual across spreadsheets.",
      gain: "Auto-mapped DORA Article 28 obligations, live third-party register, AI-drafted incident reports — pre-checked against ESA RTS.",
      icon: "🏦",
      kpis: ["~280 ICT obligations indexed", "Sub-2h major incident reporting", "ESA RTS aligned"],
    },
    {
      tag: "Crypto & Web3",
      regulation: "MiCA",
      title: "Crypto-asset issuer & CASP authorization packs",
      pain: "Whitepapers, ART/EMT reserve rules, market-abuse policies — fragmented across MiCA Titles III–VI.",
      gain: "Continuous mapping of issuer obligations to your custody, treasury and disclosure controls. White-paper drafts, reviewed.",
      icon: "🪙",
      kpis: ["MiCA Titles I–VII covered", "Reserve & redemption checks", "EBA / ESMA Q&As tracked"],
    },
    {
      tag: "Payments & KYC",
      regulation: "GDPR + AMLA",
      title: "AI-driven KYC, fraud scoring & data minimization",
      pain: "Onboarding agents touch sensitive PII; DPIAs, retention rules and Article 22 (automated decisions) need provable controls.",
      gain: "Per-flow data lineage, automatic Article-by-article checks, model-card and DPIA generation tied to each agent run.",
      icon: "🛂",
      kpis: ["Article 22 guardrails", "GDPR DPIA template", "Audit-ready evidence trail"],
    },
    {
      tag: "Lending & insurance",
      regulation: "EU AI Act",
      title: "High-risk credit scoring & insurance pricing models",
      pain: "Annex III high-risk classification, bias testing, human oversight, post-market monitoring — Articles 9 to 17 obligations.",
      gain: "AI Act conformity assessment scaffolded from your model card: risk management, data governance, transparency, oversight.",
      icon: "📈",
      kpis: ["AI Act Articles 9-17", "Bias & robustness checks", "FUNDamental rights impact"],
    },
    {
      tag: "Asset management",
      regulation: "SFDR + MiFID II",
      title: "Sustainable finance disclosures & client-suitability AI",
      pain: "PAI indicators, Article 8/9 fund classification, suitability narratives — manual review per fund per quarter.",
      gain: "Generative drafting of disclosures with citations, MiFID suitability checklist auto-applied to robo-advice transcripts.",
      icon: "🌱",
      kpis: ["SFDR Articles 8/9", "MiFID II suitability", "Automated PAI tagging"],
    },
    {
      tag: "Neobanks & PSPs",
      regulation: "PSD3 + PSR",
      title: "Strong customer authentication & open-banking AI",
      pain: "SCA exemptions, fraud-rate thresholds, third-party access (TPP) liability — moving target across PSD3 + PSR.",
      gain: "Live obligation tracker for SCA, dispute & refund timelines wired to your AI assistant's tool calls.",
      icon: "💳",
      kpis: ["PSD3/PSR draft tracking", "SCA decision rationale", "TPP access logs"],
    },
  ];

  return (
    <section
      id="usecases"
      className="mx-auto max-w-7xl px-6 py-24 border-t border-white/[0.06]"
    >
      <div className="text-center max-w-3xl mx-auto">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/55">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
          Fintech use cases
        </span>
        <h2 className="mt-5 text-[34px] md:text-[42px] font-semibold tracking-tight">
          Built for the workflows that move money and risk
        </h2>
        <p className="mt-4 text-[15px] text-white/60 leading-relaxed">
          From DORA resilience drills to MiCA whitepapers and AI Act conformity, INTEGREAT
          turns regulation text into agent-ready guardrails. Six concrete fintech bundles,
          ready to plug into your stack.
        </p>
      </div>
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {cases.map((c) => (
          <div
            key={c.title}
            className="group relative rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.04] to-white/[0.015] p-6 hover:border-white/15 transition"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[22px] leading-none">{c.icon}</span>
              <span className="text-[10.5px] uppercase tracking-[0.16em] text-white/55">
                {c.tag}
              </span>
              <span className="ml-auto rounded-md border border-violet-300/30 bg-violet-500/10 px-2 py-0.5 text-[10.5px] font-medium text-violet-200">
                {c.regulation}
              </span>
            </div>
            <h3 className="text-[16px] font-semibold tracking-tight leading-snug">
              {c.title}
            </h3>
            <div className="mt-4 space-y-2.5 text-[12.5px] leading-relaxed">
              <p>
                <span className="text-pink-300/80 font-medium">Pain · </span>
                <span className="text-white/65">{c.pain}</span>
              </p>
              <p>
                <span className="text-emerald-300/80 font-medium">Gain · </span>
                <span className="text-white/75">{c.gain}</span>
              </p>
            </div>
            <ul className="mt-5 flex flex-wrap gap-1.5">
              {c.kpis.map((k) => (
                <li
                  key={k}
                  className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[10.5px] text-white/65"
                >
                  {k}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-10 text-center">
        <Link href="/dashboard" className="btn-primary">
          Explore the trust workspace
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    </section>
  );
}

function Architecture() {
  return (
    <section id="architecture" className="mx-auto max-w-7xl px-6 py-24 border-t border-white/[0.06]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="pill">architecture</span>
          <h2 className="mt-5 text-[34px] md:text-[40px] font-semibold tracking-tight">
            Built for <span className="text-gradient">EU sovereignty</span> and zero-trust.
          </h2>
          <p className="mt-3 text-[14.5px] text-white/55 max-w-[520px]">
            Every byte stays inside <span className="font-mono text-white/80">europe-west1</span>.
            Cloud SQL is private-IP only, behind a Serverless VPC connector. Reads from the web app
            are read-only. AI calls go to Vertex with VPC-SC perimeter.
          </p>
          <ul className="mt-5 grid grid-cols-2 gap-2 text-[12.5px] text-white/70 max-w-[520px]">
            {[
              "Cloud Run + WIF",
              "Cloud SQL pgvector",
              "Vertex Vector Search",
              "Gemini 2.5 Flash",
              "EUR-Lex Cellar",
              "BigQuery audit log",
              "Secret Manager",
              "Workload Identity Fed.",
            ].map((t) => (
              <li key={t} className="chip !justify-start">{t}</li>
            ))}
          </ul>
        </div>
        <div className="card-elevated p-5 relative overflow-hidden">
          <div className="aurora absolute -inset-12 opacity-30" />
          <div className="relative">
            <ArchitectureSvg />
          </div>
        </div>
      </div>
    </section>
  );
}

function ArchitectureSvg() {
  return (
    <svg viewBox="0 0 600 360" className="w-full h-auto">
      <defs>
        <linearGradient id="archGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7c5cff" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      {/* Sources */}
      <g>
        <Box x={20} y={30} w={120} h={36} title="EUR-Lex Cellar" />
        <Box x={20} y={80} w={120} h={36} title="Google Drive" />
        <Box x={20} y={130} w={120} h={36} title="GitHub" />
        <Box x={20} y={180} w={120} h={36} title="Jira / Slack" />
      </g>
      {/* Pipelines */}
      <g>
        <Box x={210} y={30} w={170} h={50} title="risk-knowledge" sub="ingest · embed · extract" tone="#7c5cff" />
        <Box x={210} y={120} w={170} h={50} title="risk-scoring" sub="RAG · sandbox · score" tone="#38bdf8" />
        <Box x={210} y={210} w={170} h={50} title="risk-coverage" sub="match · certify · quote" tone="#f472b6" />
      </g>
      {/* Storage */}
      <g>
        <Box x={430} y={30} w={150} h={36} title="Cloud SQL pgvector" />
        <Box x={430} y={80} w={150} h={36} title="Vector Search index" />
        <Box x={430} y={130} w={150} h={36} title="BigQuery audit_log" />
        <Box x={430} y={180} w={150} h={36} title="GCS evidence packs" />
      </g>
      {/* Edges */}
      <g stroke="url(#archGrad)" strokeWidth={1.4} fill="none" opacity={0.7}>
        <path d="M140 48 C 175 48, 175 55, 210 55" />
        <path d="M140 98 C 175 98, 175 60, 210 60" />
        <path d="M140 148 C 175 148, 175 145, 210 145" />
        <path d="M140 198 C 175 198, 175 235, 210 235" />
        <path d="M380 55 C 405 55, 405 48, 430 48" />
        <path d="M380 60 C 405 60, 405 98, 430 98" />
        <path d="M380 145 C 405 145, 405 148, 430 148" />
        <path d="M380 235 C 405 235, 405 198, 430 198" />
      </g>
      <text x="300" y="320" textAnchor="middle" fontSize={11} fill="rgba(255,255,255,0.5)" fontFamily="ui-monospace,monospace">
        europe-west1 · private VPC · WIF
      </text>
    </svg>
  );
}

function Box({
  x,
  y,
  w,
  h,
  title,
  sub,
  tone,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub?: string;
  tone?: string;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={8}
        fill="rgba(255,255,255,0.04)"
        stroke={tone || "rgba(255,255,255,0.16)"}
        strokeWidth={1.2}
      />
      <text x={x + 12} y={y + (sub ? 20 : 22)} fontSize={12} fontWeight={600} fill="white">
        {title}
      </text>
      {sub ? (
        <text x={x + 12} y={y + 36} fontSize={10} fill="rgba(255,255,255,0.5)">
          {sub}
        </text>
      ) : null}
    </g>
  );
}

function FeatureMatrix() {
  const features = [
    {
      icon: <IconShield />,
      t: "Continuous trust score",
      d: "Per agent, per dimension. Recomputed when regulations or your data change.",
    },
    {
      icon: <IconGraph />,
      t: "Live regulatory graph",
      d: "Browse rules by article, see linked obligations, standards and insurance clauses.",
    },
    {
      icon: <IconTree />,
      t: "Visual policy wizard",
      d: "Decision tree to pick the right governance bundle for any new agent.",
    },
    {
      icon: <IconPdf />,
      t: "PDF reports & certification",
      d: "Audit-ready evidence packs with citations back to the legal text.",
    },
    {
      icon: <IconUmbrella />,
      t: "Insurance matching",
      d: "Compare AI liability products and prove coverage clause-by-clause.",
    },
    {
      icon: <IconLock />,
      t: "Sovereign by default",
      d: "Data never leaves europe-west1. Private VPC, WIF auth, full audit trail.",
    },
  ];
  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-24 border-t border-white/[0.06]">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-10">
        <div>
          <span className="pill">features</span>
          <h2 className="mt-5 text-[34px] md:text-[40px] font-semibold tracking-tight">
            Everything you need, <span className="text-gradient">one workspace</span>.
          </h2>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {features.map((f) => (
          <div key={f.t} className="card p-5 flex flex-col gap-3">
            <div className="h-9 w-9 rounded-md bg-white/[0.04] border border-white/[0.06] grid place-items-center">
              {f.icon}
            </div>
            <div className="text-[15px] font-semibold">{f.t}</div>
            <div className="text-[12.5px] text-white/55">{f.d}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Compliance() {
  return (
    <section id="compliance" className="mx-auto max-w-7xl px-6 py-24 border-t border-white/[0.06]">
      <div className="text-center max-w-[640px] mx-auto">
        <span className="pill">covered out-of-the-box</span>
        <h2 className="mt-5 text-[34px] md:text-[40px] font-semibold tracking-tight">
          Live coverage of every <span className="text-gradient">EU AI rule</span>.
        </h2>
      </div>
      <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { c: "32024R1689", n: "AI Act" },
          { c: "32022R2554", n: "DORA" },
          { c: "32023R1114", n: "MiCA" },
          { c: "32016R0679", n: "GDPR" },
          { c: "ISO 42001", n: "AI management system" },
          { c: "ISO 27001", n: "Information security" },
          { c: "NIST AI RMF", n: "AI risk management" },
          { c: "EN ISO 22989", n: "AI concepts & terminology" },
        ].map((r) => (
          <div key={r.c} className="card p-4">
            <div className="text-[16px] font-semibold">{r.n}</div>
            <div className="text-[11px] font-mono text-white/45 mt-1">{r.c}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="card-elevated p-10 md:p-14 text-center relative overflow-hidden">
        <div className="aurora absolute -inset-12 opacity-50" />
        <div className="relative">
          <h2 className="text-[34px] md:text-[44px] font-semibold tracking-tight">
            Ready to <span className="text-gradient">prove trust</span> for your agents?
          </h2>
          <p className="text-[14.5px] text-white/60 mt-3 max-w-[540px] mx-auto">
            Spin up your workspace. Connect data. Get your first trust report in minutes.
          </p>
          <div className="mt-7 flex flex-wrap gap-2 justify-center">
            <Link href="/dashboard" className="btn-primary !py-2.5 !px-4 text-[13.5px]">
              Open the app
            </Link>
            <a
              href="https://github.com/evanmse/integreat"
              target="_blank"
              rel="noreferrer"
              className="btn-ghost !py-2.5 !px-4 text-[13.5px]"
            >
              Read the source
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mx-auto max-w-7xl px-6 py-10">
      <div className="divider-glow mb-6" />
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between text-xs text-white/40">
        <div>© 2026 Integreat — built on Cloud Run, Cloud SQL pgvector, Vertex AI Vector Search.</div>
        <div className="font-mono">europe-west1 · gemini-2.5-flash · text-embedding-005</div>
      </div>
    </footer>
  );
}

/* ====== icons ====== */
function IconShield() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.6} className="text-violet-300">
      <path d="M12 3 4 6v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V6l-8-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
function IconGraph() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.6} className="text-sky-300">
      <circle cx={5} cy={5} r={2.2} />
      <circle cx={19} cy={6} r={2.2} />
      <circle cx={12} cy={13} r={2.2} />
      <circle cx={6} cy={20} r={2.2} />
      <circle cx={18} cy={19} r={2.2} />
      <path d="m7 6 3.5 5M17 7l-3.5 5M11 14 7.5 18M13 14l4 4" />
    </svg>
  );
}
function IconTree() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.6} className="text-pink-300">
      <rect x={9} y={3} width={6} height={4} rx={1} />
      <rect x={3} y={13} width={6} height={4} rx={1} />
      <rect x={15} y={13} width={6} height={4} rx={1} />
      <path d="M12 7v3M12 10H6v3M12 10h6v3" />
    </svg>
  );
}
function IconPdf() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.6} className="text-emerald-300">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M9 13h6M9 17h6" />
    </svg>
  );
}
function IconUmbrella() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.6} className="text-amber-300">
      <path d="M3 12a9 9 0 0 1 18 0H3z" />
      <path d="M12 12v6a3 3 0 0 0 6 0" />
    </svg>
  );
}
function IconLock() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.6} className="text-violet-300">
      <rect x={4} y={11} width={16} height={10} rx={2} />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
