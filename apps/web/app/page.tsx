import Link from "next/link";

export const metadata = {
  title: "Integreat — Compliance, integrated.",
  description:
    "EU AI Act, DORA, RGPD evidence collected from your own repos, docs and tickets. Signed governance policy + Jira plan + insurance quote.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <NavTop />
      <Hero />
      <Pipelines />
      <Regulations />
      <HowItWorks />
      <Trust />
      <CTA />
      <FooterBar />
    </div>
  );
}

/* ============================================================
   NAV
   ============================================================ */
function Wordmark() {
  return (
    <span className="wm">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <rect x={3.5} y={3.5} width={17} height={17} rx={3.2} />
        <path d="M8 12.2 L11 15.2 L16.5 8.8" />
      </svg>
      <span className="text-[18px] font-semibold tracking-tight">
        inte<span className="great">great</span>
      </span>
    </span>
  );
}

function NavTop() {
  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{
        background: "rgba(250,248,244,0.78)",
        backdropFilter: "blur(14px) saturate(160%)",
        WebkitBackdropFilter: "blur(14px) saturate(160%)",
        borderColor: "var(--bone-300)",
      }}
    >
      <div className="mx-auto max-w-[1200px] px-8 h-[64px] flex items-center justify-between">
        <Link href="/">
          <Wordmark />
        </Link>
        <div className="hidden md:flex gap-7 text-[13.5px] text-[var(--ink-700)]">
          <a href="#pipelines" className="hover:text-[var(--ink-900)]">How it works</a>
          <a href="#regulations" className="hover:text-[var(--ink-900)]">Regulations</a>
          <a href="#trust" className="hover:text-[var(--ink-900)]">Trust</a>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/login" className="btn-secondary">Sign in</Link>
          <Link href="/dashboard" className="btn-primary">
            Open the app
            <span className="inline-block transition-transform duration-200 hover:translate-x-0.5">→</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ============================================================
   HERO
   ============================================================ */
function Hero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        padding: "72px 0 96px",
        background:
          "radial-gradient(ellipse 1200px 600px at 50% -100px, rgba(217,119,87,0.06), transparent 60%), var(--bone-50)",
      }}
    >
      <div className="absolute inset-0 pointer-events-none lattice opacity-[0.6]" style={{
        WebkitMaskImage: "radial-gradient(ellipse 800px 500px at 50% 60%, #000 0%, transparent 75%)",
        maskImage: "radial-gradient(ellipse 800px 500px at 50% 60%, #000 0%, transparent 75%)",
      }} />
      <div className="relative mx-auto max-w-[1200px] px-8">
        <div className="flex flex-col items-center text-center gap-7">
          <span className="t-eyebrow">Compliance, integrated.</span>
          <h1
            className="font-semibold m-0"
            style={{
              fontSize: "clamp(44px, 6.4vw, 80px)",
              letterSpacing: "-0.032em",
              lineHeight: 1.02,
              maxWidth: "14ch",
              textWrap: "balance",
            }}
          >
            EU compliance, <span style={{ color: "var(--orange)" }}>integrated</span> into your stack.
          </h1>
          <p
            className="text-[18px] m-0"
            style={{ color: "var(--ink-600)", lineHeight: 1.55, maxWidth: 580 }}
          >
            Integreat reads your repos, docs and tickets — read-only — and produces a signed
            governance policy, a Jira action plan, and a binding insurance quote. EU AI Act, DORA
            and RGPD evidence collected from your own systems. Nothing leaves.
          </p>
          <div className="flex flex-wrap gap-3 items-center justify-center">
            <Link href="/dashboard" className="btn-primary" style={{ height: 52, padding: "0 22px", fontSize: 15 }}>
              Run a free scan
              <span>→</span>
            </Link>
            <a href="#pipelines" className="btn-secondary" style={{ height: 52, padding: "0 22px", fontSize: 15 }}>
              See it work
            </a>
            <span className="t-mono" style={{ fontSize: 11.5, color: "var(--ink-500)" }}>
              No card · 4 connectors · ~6 min
            </span>
          </div>
        </div>

        {/* preview card */}
        <div className="mt-16 mx-auto max-w-[940px] card card-elevated overflow-hidden">
          <div
            className="flex items-center justify-between px-5 py-3 border-b"
            style={{ borderColor: "var(--bone-300)", background: "var(--bone-100)" }}
          >
            <span className="t-eyebrow">Live · scn_8f3a</span>
            <span className="t-mono" style={{ fontSize: 11.5, color: "var(--ink-600)" }}>
              acme · credit-engine
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 p-6 items-center">
            <ScoreRing value={84} />
            <Heatmap />
          </div>
          <div
            className="flex items-center justify-between px-5 py-3 border-t t-mono"
            style={{ borderColor: "var(--bone-300)", color: "var(--ink-500)", fontSize: 11.5 }}
          >
            <span>Articles · 8</span>
            <span>Systems · 5</span>
            <span>40 / 40 evaluated</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function ScoreRing({ value }: { value: number }) {
  const r = 58;
  const c = 2 * Math.PI * r;
  const off = c * (1 - value / 100);
  return (
    <div className="relative w-[132px] h-[132px] mx-auto">
      <svg width={132} height={132} viewBox="0 0 132 132" style={{ transform: "rotate(-90deg)" }}>
        <circle cx={66} cy={66} r={r} fill="none" stroke="var(--bone-200)" strokeWidth={8} />
        <circle
          cx={66}
          cy={66}
          r={r}
          fill="none"
          stroke="var(--indigo)"
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[36px] font-semibold tabular leading-none">{value}</div>
        <div className="t-mono mt-1" style={{ fontSize: 10.5, color: "var(--ink-500)" }}>
          / 100
        </div>
      </div>
    </div>
  );
}

function Heatmap() {
  // 5 systems × 8 obligations
  const SYS = ["credit-engine", "fraud-scoring", "kyc-bot", "support-ai", "lead-router"];
  const OBL = ["A.5", "A.10", "A.14", "A.15", "A.27", "A.50", "A.61", "A.86"];
  const cells: ("low" | "med" | "high")[][] = [
    ["low", "low", "high", "med", "low", "low", "low", "med"],
    ["low", "med", "low", "low", "low", "low", "low", "low"],
    ["low", "low", "low", "low", "med", "low", "low", "low"],
    ["low", "low", "low", "low", "low", "low", "low", "low"],
    ["low", "med", "low", "low", "low", "low", "low", "low"],
  ];
  const tone = (k: "low" | "med" | "high") =>
    k === "high"
      ? { bg: "var(--risk-high-bg)", fg: "oklch(40% 0.18 27)" }
      : k === "med"
      ? { bg: "var(--risk-med-bg)", fg: "oklch(40% 0.14 75)" }
      : { bg: "var(--risk-low-bg)", fg: "oklch(38% 0.14 145)" };
  return (
    <div className="overflow-hidden rounded-lg border" style={{ borderColor: "var(--bone-300)" }}>
      <div
        className="grid"
        style={{ gridTemplateColumns: `120px repeat(${OBL.length}, minmax(0, 1fr))` }}
      >
        <div className="t-eyebrow px-3 py-2 border-b border-r" style={{ borderColor: "var(--bone-300)", background: "var(--bone-100)" }} />
        {OBL.map((o) => (
          <div key={o} className="t-mono text-center py-2 border-b border-r last:border-r-0" style={{ fontSize: 10.5, color: "var(--ink-600)", borderColor: "var(--bone-300)", background: "var(--bone-100)" }}>
            {o}
          </div>
        ))}
        {SYS.map((s, i) => (
          <>
            <div key={s} className="t-mono px-3 py-2 border-b border-r last:border-b-0" style={{ fontSize: 11.5, color: "var(--ink-700)", borderColor: "var(--bone-300)", background: "var(--bone-100)" }}>
              {s}
            </div>
            {cells[i].map((k, j) => {
              const t = tone(k);
              return (
                <div
                  key={`${i}-${j}`}
                  className="text-center py-3 border-b border-r last:border-r-0 t-mono"
                  style={{ background: t.bg, color: t.fg, borderColor: "var(--bone-300)", fontSize: 10.5, letterSpacing: "0.06em" }}
                >
                  {k.toUpperCase()}
                </div>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   PIPELINES (How it works)
   ============================================================ */
function Pipelines() {
  const steps = [
    {
      n: "01",
      title: "Connect",
      lede:
        "Plug GitHub, Jira, Google Drive and Microsoft Teams. We index your AI systems read-only, in 60 seconds.",
    },
    {
      n: "02",
      title: "Scan",
      lede:
        "Live trace over your repos, tickets and docs. We surface obligations × system pairs and rate every cell.",
    },
    {
      n: "03",
      title: "Risk map",
      lede:
        "An obligations × AI-systems heatmap with one drill click into every HIGH cell. Compliance score, computed.",
    },
    {
      n: "04",
      title: "Sandbox",
      lede:
        "We adversarially probe each system: bias, prompt injection, robustness, data leakage. Priority fixes ranked.",
    },
    {
      n: "05",
      title: "Output",
      lede:
        "Cert-readiness gauge, signed PDF policy, Jira epics, binding AI-liability insurance quote. Audit-ready.",
    },
  ];
  return (
    <section id="pipelines" className="py-20 border-t" style={{ borderColor: "var(--bone-300)", background: "var(--bone-100)" }}>
      <div className="mx-auto max-w-[1200px] px-8">
        <div className="mb-12 text-center">
          <span className="t-eyebrow">How it works</span>
          <h2 className="font-semibold mt-3" style={{ fontSize: "clamp(28px, 3vw, 40px)", letterSpacing: "-0.022em" }}>
            Five steps from connection to certificate.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {steps.map((s) => (
            <div key={s.n} className="card p-5 hover:border-[var(--ink-700)] transition-colors">
              <div className="t-mono mb-3" style={{ fontSize: 11, color: "var(--ink-500)", letterSpacing: "0.08em" }}>
                STEP {s.n}
              </div>
              <h3 className="font-semibold text-[16px] mb-1.5">{s.title}</h3>
              <p className="text-[13px]" style={{ color: "var(--ink-600)", lineHeight: 1.55 }}>
                {s.lede}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   REGULATIONS
   ============================================================ */
function Regulations() {
  const regs = [
    { tag: "EU AI Act", desc: "Annex III high-risk obligations, transparency, conformity assessment, post-market monitoring." },
    { tag: "DORA", desc: "Operational resilience, ICT third-party risk, incident reporting, threat-led penetration testing." },
    { tag: "GDPR", desc: "Lawfulness, DPIA, transparency, automated decisions, data subject rights." },
    { tag: "MiCA", desc: "Crypto-asset service provider duties, market abuse, prudential requirements." },
  ];
  return (
    <section id="regulations" className="py-20 border-t" style={{ borderColor: "var(--bone-300)" }}>
      <div className="mx-auto max-w-[1200px] px-8">
        <div className="mb-10">
          <span className="t-eyebrow">Regulations covered</span>
          <h2 className="font-semibold mt-3" style={{ fontSize: "clamp(26px, 2.6vw, 36px)", letterSpacing: "-0.022em" }}>
            Vector-grounded on the official corpora.
          </h2>
          <p className="text-[15px] mt-3 max-w-[640px]" style={{ color: "var(--ink-600)" }}>
            Every finding cites the article. Every score is computed from the matrix. We embed the
            full regulatory text and map each obligation to your AI systems with a 768-d retrieval.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {regs.map((r) => (
            <div key={r.tag} className="card p-5">
              <div className="chip chip-violet mb-3">{r.tag}</div>
              <p className="text-[13px]" style={{ color: "var(--ink-600)", lineHeight: 1.55 }}>
                {r.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   How it works detail (with mock terminal)
   ============================================================ */
function HowItWorks() {
  return (
    <section className="py-20 border-t" style={{ borderColor: "var(--bone-300)", background: "var(--bone-100)" }}>
      <div className="mx-auto max-w-[1200px] px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="t-eyebrow">Live trace</span>
          <h2 className="font-semibold mt-3" style={{ fontSize: "clamp(26px, 2.6vw, 36px)", letterSpacing: "-0.022em" }}>
            What you see while we scan.
          </h2>
          <p className="text-[15px] mt-3" style={{ color: "var(--ink-600)" }}>
            A streaming log, real counters, zero magic. Every line is a verifiable step — repo
            traversal, embedding, obligation match, policy verdict. You can stop and inspect any
            artefact at any time.
          </p>
        </div>
        <div className="card overflow-hidden font-mono" style={{ background: "var(--ink-900)" }}>
          <div className="px-4 py-2 border-b flex items-center gap-2" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ED6A5E" }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#F4BF50" }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#61C354" }} />
            <span className="ml-3 text-[11px]" style={{ color: "rgba(255,255,255,0.55)" }}>integreat://scan/scn_8f3a</span>
          </div>
          <pre className="px-4 py-3 text-[12.5px] leading-[1.7]" style={{ color: "rgba(255,255,255,0.85)", margin: 0 }}>
{`> connecting github://acme/credit-engine
  ✓ 4 218 files indexed
> embedding obligations  (text-embedding-005)
  ✓ EU AI Act      · 612 obligations
  ✓ DORA           · 287 obligations
  ✓ GDPR           · 173 obligations
  ✓ MiCA           · 144 obligations
> matching obligations × systems
  ⏳ 38 / 40 evaluated · 1 HIGH · 3 MED · 34 LOW
> generating policy.pdf …
  ✓ signed · sha256: 4a7c…91ef`}
          </pre>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   TRUST
   ============================================================ */
function Trust() {
  const items = [
    { kpi: "Read-only", lede: "We never write to your stack. Tokens are scoped, encrypted at rest, revocable." },
    { kpi: "Vector DB", lede: "Postgres + pgvector. Your corpus stays in your tenant. No third-party LLM training." },
    { kpi: "Signed PDF", lede: "Every policy is signed and timestamped. Court-quality audit trail." },
  ];
  return (
    <section id="trust" className="py-20 border-t" style={{ borderColor: "var(--bone-300)" }}>
      <div className="mx-auto max-w-[1200px] px-8">
        <span className="t-eyebrow">Trust</span>
        <h2 className="font-semibold mt-3 mb-10" style={{ fontSize: "clamp(26px, 2.6vw, 36px)", letterSpacing: "-0.022em" }}>
          Regulator-grade. Builder-grade.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {items.map((i) => (
            <div key={i.kpi} className="card p-5">
              <div className="text-[22px] font-semibold mb-1" style={{ letterSpacing: "-0.022em" }}>
                {i.kpi}
              </div>
              <p className="text-[13px]" style={{ color: "var(--ink-600)", lineHeight: 1.55 }}>
                {i.lede}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   CTA
   ============================================================ */
function CTA() {
  return (
    <section className="py-24 border-t" style={{ borderColor: "var(--bone-300)", background: "var(--bone-100)" }}>
      <div className="mx-auto max-w-[1200px] px-8 text-center flex flex-col items-center gap-6">
        <span className="t-eyebrow">Ready when you are</span>
        <h2 className="font-semibold m-0" style={{ fontSize: "clamp(34px, 4.4vw, 56px)", letterSpacing: "-0.026em", maxWidth: "16ch" }}>
          The 2 August 2026 deadline doesn’t move.
        </h2>
        <p className="text-[16px] m-0" style={{ color: "var(--ink-600)", maxWidth: 560 }}>
          Run your first scan in six minutes. Get a signed policy and a Jira plan before lunch.
        </p>
        <div className="flex gap-3 mt-2">
          <Link href="/dashboard" className="btn-primary" style={{ height: 52, padding: "0 22px", fontSize: 15 }}>
            Run a free scan →
          </Link>
          <Link href="/login" className="btn-secondary" style={{ height: 52, padding: "0 22px", fontSize: 15 }}>
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}

function FooterBar() {
  return (
    <footer className="py-10 border-t" style={{ borderColor: "var(--bone-300)" }}>
      <div className="mx-auto max-w-[1200px] px-8 flex items-center justify-between gap-4 flex-wrap">
        <Wordmark />
        <span className="t-mono" style={{ fontSize: 11.5, color: "var(--ink-500)" }}>
          © Integreat 2026 · EU AI Act, DORA, RGPD, MiCA · Made for fintechs in Europe.
        </span>
      </div>
    </footer>
  );
}
