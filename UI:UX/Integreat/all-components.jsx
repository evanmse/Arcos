
/* ===== logo.jsx ===== */
/* global React */
/*
  Integreat marks. All share:
    - 1.6px stroke at 24px size (scales linearly via vector-effect)
    - Hairline corners, no rounded caps inside the geometry
    - 24×24 viewBox so icons drop into chips & favicons
*/

const Mark = ({ variant = "checksquare", size = 24, color = "currentColor", strokeWidth = 1.6 }) => {
  const props = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth, strokeLinecap: "round", strokeLinejoin: "round" };

  if (variant === "checksquare") {
    return (
      <svg {...props}>
        <rect x="3.5" y="3.5" width="17" height="17" rx="3.2" />
        <path d="M8 12.2 L11 15.2 L16.5 8.8" />
      </svg>
    );
  }
  if (variant === "diamond") {
    return (
      <svg {...props}>
        <path d="M12 2.5 L21.5 12 L12 21.5 L2.5 12 Z" />
        <path d="M8 12 L11 15 L16 9.5" />
      </svg>
    );
  }
  if (variant === "twocircles") {
    return (
      <svg {...props}>
        <circle cx="9" cy="12" r="6.5" />
        <circle cx="15" cy="12" r="6.5" />
      </svg>
    );
  }
  if (variant === "step") {
    return (
      <svg {...props}>
        <path d="M4 19 L4 4 L12 4 L12 19 M12 12 L20 12 L20 19" />
      </svg>
    );
  }
  return null;
};

const Wordmark = ({ variant = "checksquare", size = 28, color = "var(--ink-900)" }) => {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: size * 0.36, color }}>
      <Mark variant={variant} size={size} color={color} />
      <span style={{
        fontFamily: "var(--font-display)",
        fontWeight: 600,
        fontSize: size * 0.78,
        letterSpacing: "-0.022em",
        color
      }}>
        integreat
      </span>
    </div>
  );
};

window.Mark = Mark;
window.Wordmark = Wordmark;

/* ===== brand-page.jsx ===== */
/* global React, Mark, Wordmark */

/* ============================================================
   BRAND CANVAS — Integreat
   Sections: Rationale, Logo, Color, Type, Components
   ============================================================ */

const BrandPage = () => {
  return (
    <div style={brandStyles.page}>
      <BrandHeader />
      <Rationale />
      <LogoSystem />
      <ColorSystem />
      <TypeSystem />
      <ComponentLibrary />
      <BrandFooter />
    </div>
  );
};

const BrandHeader = () => (
  <header style={brandStyles.header}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <Wordmark size={26} />
      <div className="t-eyebrow">Brand System · v0.1 · Apr 2026</div>
    </div>
    <div style={{ marginTop: 56, maxWidth: 760 }}>
      <div className="t-eyebrow" style={{ marginBottom: 14 }}>01 — Identity</div>
      <h1 style={brandStyles.displayXL}>
        Regulator-grade trust.<br/>
        <span style={{ color: "var(--ink-500)" }}>Builder-grade speed.</span>
      </h1>
      <p style={brandStyles.lede}>
        Integreat helps European fintechs reach AI Act, DORA and RGPD compliance before the
        2&nbsp;August&nbsp;2026 deadline — by integrating governance directly into the engineering stack
        instead of bolting it on after the fact.
      </p>
    </div>
  </header>
);

/* ---------- Rationale ---------- */
const Rationale = () => (
  <Section eyebrow="02 — Rationale" title="Why this looks the way it looks">
    <div style={brandStyles.rationaleGrid}>
      {[
        { k: "Name", v: "integrate + great. The product integrates AI governance into the stack and makes compliance feel achievable rather than dreadful." },
        { k: "Posture", v: "Light-first, generous whitespace at the marketing layer; dense and tabular at the data layer. The duality is the design." },
        { k: "Tone", v: "Calm precision. We surface code, logs and obligations — never marketing fog. Regulators trust us; engineers don't roll their eyes." },
        { k: "References", v: "Linear (precision), Stripe (clarity), Vanta (trust). Avoid: dusty audit-firm seals, generic AI gradients, lock icons." },
      ].map((row) => (
        <div key={row.k} style={brandStyles.rationaleRow}>
          <div className="t-eyebrow" style={{ width: 120, flexShrink: 0 }}>{row.k}</div>
          <div style={{ color: "var(--ink-800)", fontSize: 15.5, lineHeight: 1.55, maxWidth: 640 }}>{row.v}</div>
        </div>
      ))}
    </div>
  </Section>
);

/* ---------- Logo system ---------- */
const LogoSystem = () => {
  const variants = [
    { id: "checksquare", name: "Verified", desc: "The default. Compliance check inside a contained frame — verification as the core promise." },
    { id: "diamond",     name: "Lattice",  desc: "Diamond + check. Reads as a node in a network — Web3/AI infrastructure cue." },
    { id: "twocircles",  name: "Union",    desc: "Two intersecting circles — integrate. The mark IS the verb." },
    { id: "step",        name: "Step",     desc: "Stepped path — wizard logic, the 5-step flow distilled to a glyph." },
  ];

  return (
    <Section eyebrow="03 — Mark" title="Four directions, shared geometry">
      <p style={brandStyles.sectionLede}>
        All four marks share a 24×24 grid, 1.6px stroke, and the same corner radius family.
        Cycle them via the Tweaks panel to compare in context.
      </p>

      <div style={brandStyles.logoGrid}>
        {variants.map((v) => (
          <div key={v.id} style={brandStyles.logoCard}>
            <div style={brandStyles.logoCanvas}>
              <Mark variant={v.id} size={64} color="var(--ink-900)" />
            </div>
            <div style={{ padding: "18px 20px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>{v.name}</div>
                <div className="t-mono" style={{ fontSize: 11, color: "var(--ink-400)" }}>{v.id}</div>
              </div>
              <p style={{ fontSize: 13, color: "var(--ink-500)", lineHeight: 1.5, margin: 0 }}>{v.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Lockups */}
      <div style={{ marginTop: 64 }}>
        <div className="t-eyebrow" style={{ marginBottom: 16 }}>Lockups</div>
        <div style={brandStyles.lockupRow}>
          <LockupCard label="Primary lockup" bg="var(--bone-50)">
            <Wordmark size={36} />
          </LockupCard>
          <LockupCard label="Mark only" bg="var(--bone-50)">
            <Mark variant="checksquare" size={56} color="var(--ink-900)" />
          </LockupCard>
          <LockupCard label="Reverse" bg="var(--ink-900)">
            <Wordmark size={36} color="var(--bone-50)" />
          </LockupCard>
          <LockupCard label="Monochrome on indigo" bg="var(--indigo)">
            <Wordmark size={36} color="#FAF8F4" />
          </LockupCard>
        </div>
      </div>

      {/* Sizing */}
      <div style={{ marginTop: 56 }}>
        <div className="t-eyebrow" style={{ marginBottom: 16 }}>Scale</div>
        <div style={brandStyles.scaleRow}>
          {[16, 20, 24, 32, 48, 72].map((s) => (
            <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <Mark variant="checksquare" size={s} color="var(--ink-900)" />
              <div className="t-mono" style={{ fontSize: 10.5, color: "var(--ink-400)" }}>{s}px</div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};

const LockupCard = ({ label, bg, children }) => (
  <div style={{ flex: 1, minWidth: 220 }}>
    <div style={{ background: bg, border: "var(--hairline)", borderRadius: "var(--r-md)", height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {children}
    </div>
    <div className="t-eyebrow" style={{ marginTop: 10, fontSize: 10.5 }}>{label}</div>
  </div>
);

/* ---------- Color ---------- */
const ColorSystem = () => {
  const surfaces = [
    { name: "Bone 50",  v: "#FAF8F4", role: "Page" },
    { name: "Bone 100", v: "#F4F1EB", role: "Alt panel" },
    { name: "Bone 200", v: "#ECE7DD", role: "Card" },
    { name: "Bone 300", v: "#DDD7C9", role: "Hairline" },
    { name: "Ink 900",  v: "#0B0D10", role: "Text" },
    { name: "Ink 500",  v: "#6B7079", role: "Muted text" },
  ];
  const accents = [
    { name: "Signal Indigo", v: "oklch(58% 0.18 268)", role: "Primary action / brand" },
    { name: "Indigo Soft",   v: "oklch(94% 0.04 268)", role: "Tint / selected bg" },
    { name: "Volt",          v: "oklch(82% 0.18 128)", role: "Cert-ready / signed" },
  ];
  const risks = [
    { name: "Risk · Low",  v: "oklch(82% 0.16 145)" },
    { name: "Risk · Med",  v: "oklch(78% 0.15 75)" },
    { name: "Risk · High", v: "oklch(62% 0.20 27)" },
  ];

  return (
    <Section eyebrow="04 — Color" title="Bone, ink, and one signal">
      <p style={brandStyles.sectionLede}>
        Surface stays warm and quiet. Indigo carries the brand. Volt earns its place only when something is verified or signed.
        Risk colors are tabular — they live in cells, never in chrome.
      </p>

      <SwatchRow title="Surface · Ink" items={surfaces} />
      <SwatchRow title="Accent" items={accents} />
      <SwatchRow title="Risk states" items={risks} />
    </Section>
  );
};

const SwatchRow = ({ title, items }) => (
  <div style={{ marginTop: 32 }}>
    <div className="t-eyebrow" style={{ marginBottom: 14 }}>{title}</div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
      {items.map((s) => (
        <div key={s.name}>
          <div style={{ height: 96, borderRadius: "var(--r-md)", background: s.v, border: "var(--hairline)" }} />
          <div style={{ marginTop: 10, fontSize: 13, fontWeight: 500, letterSpacing: "-0.005em" }}>{s.name}</div>
          <div className="t-mono" style={{ fontSize: 11, color: "var(--ink-500)", marginTop: 2 }}>{s.v}</div>
          {s.role && <div style={{ fontSize: 11.5, color: "var(--ink-400)", marginTop: 2 }}>{s.role}</div>}
        </div>
      ))}
    </div>
  </div>
);

/* ---------- Type ---------- */
const TypeSystem = () => (
  <Section eyebrow="05 — Type" title="Inter Display + JetBrains Mono">
    <p style={brandStyles.sectionLede}>
      Inter handles voice. JetBrains Mono handles evidence — file paths, code, log lines, tabular numerics, regulation IDs. The pairing keeps marketing surfaces calm and data surfaces honest.
    </p>

    <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
      <div>
        <div className="t-eyebrow" style={{ marginBottom: 12 }}>Display · Inter</div>
        <div style={{ borderTop: "var(--hairline)" }}>
          {[
            { sz: 64, lh: 1.04, w: 600, t: -0.028, label: "Display XL · 64/600" },
            { sz: 44, lh: 1.08, w: 600, t: -0.024, label: "Display L · 44/600" },
            { sz: 28, lh: 1.18, w: 600, t: -0.018, label: "H1 · 28/600" },
            { sz: 17, lh: 1.45, w: 500, t: -0.005, label: "Body L · 17/500" },
            { sz: 14, lh: 1.55, w: 400, t: 0,      label: "Body · 14/400" },
          ].map((s) => (
            <div key={s.label} style={{ padding: "20px 0", borderBottom: "var(--hairline)" }}>
              <div className="t-eyebrow" style={{ marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: s.sz, lineHeight: s.lh, fontWeight: s.w, letterSpacing: `${s.t}em` }}>
                Compliance, integrated.
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="t-eyebrow" style={{ marginBottom: 12 }}>Mono · JetBrains</div>
        <div style={{ borderTop: "var(--hairline)" }}>
          {[
            { sz: 32, lh: 1.1, label: "Display · 32" },
            { sz: 16, lh: 1.5, label: "Code · 16" },
            { sz: 13, lh: 1.5, label: "Log · 13" },
            { sz: 11, lh: 1.5, label: "Caps · 11", caps: true },
          ].map((s) => (
            <div key={s.label} style={{ padding: "20px 0", borderBottom: "var(--hairline)" }}>
              <div className="t-eyebrow" style={{ marginBottom: 8 }}>{s.label}</div>
              <div className="t-mono" style={{ fontSize: s.sz, lineHeight: s.lh, letterSpacing: s.caps ? "0.12em" : 0, textTransform: s.caps ? "uppercase" : "none" }}>
                {s.caps ? "ANNEX·III · ART·14 · DORA" : "scan_id: scn_8f3a · score: 72 / 100"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </Section>
);

/* ---------- Components ---------- */
const ComponentLibrary = () => (
  <Section eyebrow="06 — Components" title="The kit">
    <p style={brandStyles.sectionLede}>
      The vocabulary the product is built from. Every screen in the prototype uses these and only these.
    </p>

    <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
      <ComponentCard title="Buttons">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <button className="btn btn-primary">Run scan</button>
          <button className="btn btn-secondary">Connect GitHub</button>
          <button className="btn btn-ghost">Skip</button>
          <button className="btn btn-primary btn-sm">Save</button>
        </div>
      </ComponentCard>

      <ComponentCard title="Chips">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <span className="chip chip-indigo">EU AI Act</span>
          <span className="chip chip-volt">Verified</span>
          <span className="chip chip-ink">High-risk</span>
          <span className="chip chip-bone">RGPD · Art. 22</span>
        </div>
      </ComponentCard>

      <ComponentCard title="Risk cell">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, border: "var(--hairline)", borderRadius: 8, overflow: "hidden" }}>
          <div className="risk-cell low">LOW · 2</div>
          <div className="risk-cell med">MED · 5</div>
          <div className="risk-cell high">HIGH · 1</div>
        </div>
      </ComponentCard>

      <ComponentCard title="Field">
        <label className="t-eyebrow" style={{ display: "block", marginBottom: 8 }}>GitHub repository</label>
        <div className="field">
          <span className="t-mono" style={{ color: "var(--ink-400)" }}>github.com/</span>
          <input className="field-input" defaultValue="company/credit-engine" />
          <span className="chip chip-volt" style={{ fontSize: 10.5 }}>connected</span>
        </div>
      </ComponentCard>

      <ComponentCard title="Score ring">
        <ScoreRing value={72} label="Compliance" />
      </ComponentCard>

      <ComponentCard title="Log line">
        <div className="t-mono" style={{ fontSize: 12.5, lineHeight: 1.7, background: "var(--ink-900)", color: "#E8E5DD", padding: 14, borderRadius: 8 }}>
          <div><span style={{ color: "#7AA0FF" }}>14:02:18</span> scan.start <span style={{ color: "var(--ink-400)" }}>repo=credit-engine</span></div>
          <div><span style={{ color: "#7AA0FF" }}>14:02:19</span> deps.parse <span style={{ color: "var(--ink-400)" }}>found=247</span></div>
          <div><span style={{ color: "#7AA0FF" }}>14:02:21</span> ai.detect  <span style={{ color: "#B8E986" }}>components=6</span></div>
        </div>
      </ComponentCard>
    </div>
  </Section>
);

const ScoreRing = ({ value = 72, label = "Score", size = 96 }) => {
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - value / 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bone-300)" strokeWidth="6" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--indigo)" strokeWidth="6" strokeLinecap="round"
                strokeDasharray={c} strokeDashoffset={off}
                transform={`rotate(-90 ${size/2} ${size/2})`} />
      </svg>
      <div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 600, letterSpacing: "-0.02em" }}>
          {value}<span style={{ color: "var(--ink-400)", fontSize: 18, fontWeight: 500 }}> / 100</span>
        </div>
        <div className="t-eyebrow" style={{ marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
};

const ComponentCard = ({ title, children }) => (
  <div style={{ background: "var(--bone-50)", border: "var(--hairline)", borderRadius: "var(--r-lg)", padding: 24 }}>
    <div className="t-eyebrow" style={{ marginBottom: 16 }}>{title}</div>
    {children}
  </div>
);

/* ---------- Section wrapper ---------- */
const Section = ({ eyebrow, title, children }) => (
  <section style={brandStyles.section}>
    <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 24 }}>
      <div className="t-eyebrow">{eyebrow}</div>
      <div style={{ flex: 1, height: 1, background: "var(--bone-300)" }} />
    </div>
    <h2 style={brandStyles.h1}>{title}</h2>
    <div style={{ marginTop: 24 }}>{children}</div>
  </section>
);

const BrandFooter = () => (
  <footer style={{ padding: "48px 64px 64px", borderTop: "var(--hairline)", background: "var(--bone-100)" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <Wordmark size={20} />
      <div className="t-mono" style={{ fontSize: 11, color: "var(--ink-500)" }}>
        © 2026 Integreat · Brand v0.1
      </div>
    </div>
  </footer>
);

/* ---------- Styles ---------- */
const brandStyles = {
  page: { background: "var(--bone-50)", color: "var(--ink-900)", width: "100%", minHeight: "100%" },
  header: { padding: "56px 64px 48px", borderBottom: "var(--hairline)", background: "var(--bone-50)" },
  displayXL: { fontFamily: "var(--font-display)", fontSize: 64, lineHeight: 1.04, fontWeight: 600, letterSpacing: "-0.028em", margin: 0 },
  lede: { fontSize: 18, lineHeight: 1.55, color: "var(--ink-600)", marginTop: 24, maxWidth: 660, fontWeight: 400 },
  section: { padding: "72px 64px", borderBottom: "var(--hairline)" },
  h1: { fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 600, letterSpacing: "-0.022em", margin: 0 },
  sectionLede: { fontSize: 16, lineHeight: 1.55, color: "var(--ink-600)", marginTop: 12, maxWidth: 680 },
  rationaleGrid: { display: "flex", flexDirection: "column", gap: 0 },
  rationaleRow: { display: "flex", gap: 32, padding: "20px 0", borderBottom: "var(--hairline)", alignItems: "flex-start" },
  logoGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 8 },
  logoCard: { background: "var(--bone-50)", border: "var(--hairline)", borderRadius: "var(--r-lg)", overflow: "hidden" },
  logoCanvas: { height: 180, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(180deg, var(--bone-100) 0%, var(--bone-50) 100%)", borderBottom: "var(--hairline)" },
  lockupRow: { display: "flex", gap: 16 },
  scaleRow: { display: "flex", alignItems: "flex-end", gap: 32, padding: "32px 0", borderTop: "var(--hairline)", borderBottom: "var(--hairline)" },
};

window.BrandPage = BrandPage;
window.ScoreRing = ScoreRing;

/* ===== prototype-shell.jsx ===== */
/* global React, Mark, Wordmark */

const { useState, useEffect, useRef, useMemo } = React;

/* ============================================================
   PROTOTYPE — Integreat 5-step wizard
   ============================================================ */

const STEPS = [
  { id: 1, key: "profile",   label: "Profile",   sub: "Stack & systems" },
  { id: 2, key: "scanning",  label: "Scanning",  sub: "Live analysis" },
  { id: 3, key: "risk",      label: "Risk map",  sub: "Obligations × systems" },
  { id: 4, key: "sandbox",   label: "Sandbox",   sub: "Adversarial tests" },
  { id: 5, key: "output",    label: "Output",    sub: "Policy · Jira · Quote" },
];

const Prototype = ({ logoVariant = "checksquare" }) => {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({
    company: "Lumen Credit",
    country: "France",
    employees: "120",
    repo: "lumen/credit-engine",
    systemType: "Credit scoring",
    connectors: { github: true, jira: true, gdrive: true, teams: false },
  });
  const [scanComplete, setScanComplete] = useState(false);

  const goNext = () => setStep((s) => Math.min(5, s + 1));
  const goPrev = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div style={protoStyles.shell}>
      <TopBar logoVariant={logoVariant} />
      <StepHeader step={step} setStep={setStep} />

      <main style={protoStyles.main}>
        {step === 1 && <StepProfile profile={profile} setProfile={setProfile} onNext={goNext} />}
        {step === 2 && <StepScanning onDone={() => setScanComplete(true)} onNext={goNext} done={scanComplete} />}
        {step === 3 && <StepRiskMap onNext={goNext} onPrev={goPrev} />}
        {step === 4 && <StepSandbox onNext={goNext} onPrev={goPrev} />}
        {step === 5 && <StepOutput onPrev={goPrev} />}
      </main>
    </div>
  );
};

/* ============================================================
   Top bar + stepper
   ============================================================ */

const TopBar = ({ logoVariant }) => (
  <header style={protoStyles.topbar}>
    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      <Wordmark variant={logoVariant} size={22} />
      <div style={{ width: 1, height: 18, background: "var(--bone-300)" }} />
      <div className="t-eyebrow">Compliance run · scn_8f3a</div>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div className="meta-pill">
        <span className="chip-dot" style={{ background: "var(--risk-high)" }} />
        <span>EU AI Act · 99 days to deadline</span>
      </div>
      <button className="btn btn-ghost btn-sm">Docs</button>
      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--ink-900)", color: "var(--bone-50)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600 }}>EM</div>
    </div>
  </header>
);

const StepHeader = ({ step, setStep }) => (
  <div style={protoStyles.stepHeader}>
    <div style={protoStyles.stepInner}>
      <div className="stepper">
        {STEPS.map((s, i) => {
          const state = s.id === step ? "active" : s.id < step ? "done" : "todo";
          return (
            <React.Fragment key={s.id}>
              <button
                onClick={() => setStep(s.id)}
                className={`step-pip ${state === "active" ? "active" : state === "done" ? "done" : ""}`}
                style={{ border: 0, cursor: "pointer", fontFamily: "inherit" }}>
                <span className="num">{state === "done" ? "✓" : String(s.id).padStart(2, "0")}</span>
                <span>{s.label}</span>
              </button>
              {i < STEPS.length - 1 && <div className="step-line" />}
            </React.Fragment>
          );
        })}
      </div>
      <div style={{ flex: 1 }} />
      <div className="t-mono" style={{ fontSize: 11, color: "var(--ink-500)" }}>
        {String(step).padStart(2, "0")} / 05
      </div>
    </div>
  </div>
);

/* ============================================================
   Common: page-level title + bottom nav
   ============================================================ */

const PageTitle = ({ eyebrow, title, subtitle, right }) => (
  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32 }}>
    <div>
      <div className="t-eyebrow" style={{ marginBottom: 10 }}>{eyebrow}</div>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 600, letterSpacing: "-0.024em", margin: 0 }}>{title}</h1>
      {subtitle && <p style={{ marginTop: 12, fontSize: 16, color: "var(--ink-500)", maxWidth: 640, lineHeight: 1.55 }}>{subtitle}</p>}
    </div>
    {right}
  </div>
);

const BottomNav = ({ onPrev, onNext, nextLabel = "Continue", canNext = true, prevLabel = "Back", note }) => (
  <div style={protoStyles.bottomNav}>
    <div>
      {onPrev && <button className="btn btn-ghost" onClick={onPrev}>← {prevLabel}</button>}
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      {note && <div className="t-mono" style={{ fontSize: 12, color: "var(--ink-500)" }}>{note}</div>}
      {onNext && (
        <button className="btn btn-primary btn-lg" onClick={onNext} disabled={!canNext} style={{ opacity: canNext ? 1 : 0.5 }}>
          {nextLabel} →
        </button>
      )}
    </div>
  </div>
);

const protoStyles = {
  shell: { display: "flex", flexDirection: "column", minHeight: "100%", background: "var(--bone-50)", color: "var(--ink-900)", fontFamily: "var(--font-ui)" },
  topbar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 32px", borderBottom: "var(--hairline)", background: "var(--bone-50)" },
  stepHeader: { borderBottom: "var(--hairline)", background: "var(--bone-100)" },
  stepInner: { display: "flex", alignItems: "center", gap: 16, padding: "14px 32px", maxWidth: 1200, margin: "0 auto" },
  main: { padding: "56px 32px 32px", maxWidth: 1200, margin: "0 auto", width: "100%", flex: 1 },
  bottomNav: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 48, paddingTop: 24, borderTop: "var(--hairline)" },
};

window.Prototype = Prototype;
window.PageTitle = PageTitle;
window.BottomNav = BottomNav;
window.protoStyles = protoStyles;

/* ===== step-profile.jsx ===== */
/* global React, PageTitle, BottomNav, protoStyles */

const StepProfile = ({ profile, setProfile, onNext }) => {
  const setConn = (key, val) => setProfile({ ...profile, connectors: { ...profile.connectors, [key]: val } });
  const setField = (k, v) => setProfile({ ...profile, [k]: v });

  return (
    <div>
      <PageTitle
        eyebrow="STEP 01 · PROFILE"
        title="Tell us what we're scanning."
        subtitle="A few facts about the company, the AI system to evaluate, and where its evidence lives. Nothing leaves your stack — connectors are read-only."
        right={
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            <div className="meta-pill" style={{ background: "var(--risk-high-bg)", borderColor: "oklch(82% 0.10 27)", color: "oklch(40% 0.18 27)" }}>
              <span className="chip-dot" style={{ background: "var(--risk-high)" }} />
              <span><strong>Aug 2, 2026</strong> — high-risk obligations live</span>
            </div>
            <div className="t-mono" style={{ fontSize: 11, color: "var(--ink-500)" }}>99 days · 14h 22m</div>
          </div>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Company */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Company</h3>
            <span className="t-mono" style={{ fontSize: 11, color: "var(--ink-400)" }}>required</span>
          </div>
          <div className="card-pad" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Field label="Legal name" value={profile.company} onChange={(v) => setField("company", v)} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Country of operation" value={profile.country} onChange={(v) => setField("country", v)} />
              <Field label="Headcount" value={profile.employees} onChange={(v) => setField("employees", v)} />
            </div>
            <SegRow label="Sector" value="BNPL" options={["BNPL", "Payments", "Lending", "Crypto", "Insurance", "Trading"]} />
          </div>
        </div>

        {/* AI system */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">AI system to evaluate</h3>
            <span className="chip chip-bone">1 of 1</span>
          </div>
          <div className="card-pad" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label className="t-eyebrow" style={{ display: "block", marginBottom: 8 }}>Repository</label>
              <div className="field">
                <span className="t-mono" style={{ color: "var(--ink-400)" }}>github.com/</span>
                <input className="field-input" value={profile.repo} onChange={(e) => setField("repo", e.target.value)} />
                <span className="chip chip-volt">connected</span>
              </div>
              <div className="t-mono" style={{ fontSize: 11, color: "var(--ink-500)", marginTop: 8 }}>
                main · 247 deps · last commit 2h ago
              </div>
            </div>
            <SegRow label="System type" value={profile.systemType} options={["Credit scoring", "Fraud detection", "KYC / onboarding", "Pricing", "Recommendation"]} />
            <div>
              <label className="t-eyebrow" style={{ display: "block", marginBottom: 8 }}>Description (optional)</label>
              <textarea className="field-textarea" rows={3} placeholder="Two lines on what the system does and who it serves." defaultValue="Real-time creditworthiness scoring for BNPL applicants. Decisions feed underwriting; humans review borderline cases." />
            </div>
          </div>
        </div>
      </div>

      {/* Connectors */}
      <div style={{ marginTop: 24 }}>
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Evidence sources</h3>
              <div style={{ fontSize: 12.5, color: "var(--ink-500)", marginTop: 2 }}>Read-only. We pull artifacts; we never push.</div>
            </div>
            <span className="t-mono" style={{ fontSize: 11, color: "var(--ink-500)" }}>3 of 4 connected</span>
          </div>
          <div className="card-pad" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            <ConnectorTile id="github" label="GitHub" sub="247 repos · 6 AI components" connected={profile.connectors.github} onToggle={(v) => setConn("github", v)} icon={<GhIcon />} />
            <ConnectorTile id="jira"   label="Jira"   sub="3 projects · 412 tickets"     connected={profile.connectors.jira}   onToggle={(v) => setConn("jira", v)}   icon={<JiraIcon />} />
            <ConnectorTile id="gdrive" label="Google Drive" sub="1.2k docs · 8 policies" connected={profile.connectors.gdrive} onToggle={(v) => setConn("gdrive", v)} icon={<DriveIcon />} />
            <ConnectorTile id="teams"  label="Microsoft Teams" sub="42 channels · 90 days history" connected={profile.connectors.teams}  onToggle={(v) => setConn("teams", v)}  icon={<TeamsIcon />} />
          </div>
        </div>
      </div>

      <BottomNav onNext={onNext} nextLabel="Run scan" note="~2 minutes · everything stays in your tenant" />
    </div>
  );
};

const Field = ({ label, value, onChange }) => (
  <div>
    <label className="t-eyebrow" style={{ display: "block", marginBottom: 8 }}>{label}</label>
    <div className="field">
      <input className="field-input" style={{ fontFamily: "var(--font-ui)", fontSize: 14 }} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  </div>
);

const SegRow = ({ label, value, options }) => {
  const [v, setV] = React.useState(value);
  return (
    <div>
      <label className="t-eyebrow" style={{ display: "block", marginBottom: 8 }}>{label}</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {options.map((o) => (
          <button key={o} onClick={() => setV(o)}
            className={v === o ? "chip chip-ink" : "chip chip-bone"}
            style={{ cursor: "pointer", border: 0, height: 30, fontSize: 12.5, padding: "0 12px", fontFamily: "inherit" }}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
};

const ConnectorTile = ({ label, sub, connected, onToggle, icon }) => (
  <div className={`connector ${connected ? "connected" : ""}`} onClick={() => onToggle(!connected)}>
    <div className="conn-icon">{icon}</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: "-0.005em" }}>{label}</div>
      <div className="t-mono" style={{ fontSize: 11, color: "var(--ink-500)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</div>
    </div>
    {connected
      ? <span className="chip chip-volt"><span className="chip-dot" style={{ background: "oklch(55% 0.18 128)" }} />on</span>
      : <span className="chip chip-bone" style={{ cursor: "pointer" }}>Connect</span>}
  </div>
);

/* ---------- Connector mark glyphs (original geometric stand-ins, not brand replicas) ---------- */
const GhIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink-800)" strokeWidth="1.6">
    <circle cx="12" cy="12" r="9" />
    <path d="M8 16 c0 -3 1 -4 4 -4 s4 1 4 4" />
    <circle cx="12" cy="9" r="2.2" />
  </svg>
);
const JiraIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink-800)" strokeWidth="1.6">
    <path d="M12 3 L21 12 L12 21 L3 12 Z" />
    <path d="M12 8 L16 12 L12 16 L8 12 Z" />
  </svg>
);
const DriveIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink-800)" strokeWidth="1.6">
    <path d="M9 4 L15 4 L21 14 L15 14 Z" />
    <path d="M9 4 L3 14 L9 14" />
    <path d="M9 14 L15 14 L18 20 L6 20 Z" />
  </svg>
);
const TeamsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink-800)" strokeWidth="1.6">
    <rect x="3" y="6" width="11" height="12" rx="1.5" />
    <path d="M5 9 L12 9 M8.5 9 L8.5 15" />
    <circle cx="18" cy="9" r="2" />
    <path d="M15 18 c0 -2 1.5 -3 3 -3 s3 1 3 3" />
  </svg>
);

window.StepProfile = StepProfile;

/* ===== step-scanning.jsx ===== */
/* global React, PageTitle, BottomNav */

const { useState: useStateScan, useEffect: useEffectScan, useRef: useRefScan } = React;

const LOG_LINES = [
  { t: "14:02:18", k: "scan.start",       v: "repo=lumen/credit-engine ref=main" },
  { t: "14:02:19", k: "deps.parse",       v: "found=247 manifests=3" },
  { t: "14:02:21", k: "ai.detect",        v: "components=6 → scoring, embedding, fraud_v2", color: "ok" },
  { t: "14:02:22", k: "ghpr.scan",        v: "open_pr=14 reviewing=12" },
  { t: "14:02:24", k: "jira.fetch",       v: "tickets=412 governance=22" },
  { t: "14:02:26", k: "drive.fetch",      v: "policies=8 dpia=2 model_cards=1" },
  { t: "14:02:28", k: "annex3.match",     v: "obligations=14 → mapping" },
  { t: "14:02:30", k: "rgpd.art22",       v: "automated_decisions=detected", color: "warn" },
  { t: "14:02:32", k: "dora.ict",         v: "vendors=11 critical=3" },
  { t: "14:02:34", k: "model.lineage",    v: "training_data: 4 sources, 1 unknown", color: "warn" },
  { t: "14:02:36", k: "bias.preflight",   v: "protected_attrs=age,nationality,gender" },
  { t: "14:02:38", k: "policy.gap",       v: "missing=human_oversight,monitoring", color: "err" },
  { t: "14:02:40", k: "score.compute",    v: "compliance=72/100" },
  { t: "14:02:41", k: "scan.done",        v: "duration=23.4s ready=true", color: "ok" },
];

const StepScanning = ({ onDone, onNext, done }) => {
  const [logs, setLogs] = useStateScan([]);
  const [progress, setProgress] = useStateScan(0);
  const [counters, setCounters] = useStateScan({ deps: 0, ai: 0, tickets: 0, obligations: 0 });
  const [phase, setPhase] = useStateScan("Booting sandbox");
  const logBoxRef = useRefScan(null);
  const isDone = done || progress >= 100;

  useEffectScan(() => {
    if (done) {
      setLogs(LOG_LINES);
      setProgress(100);
      setCounters({ deps: 247, ai: 6, tickets: 412, obligations: 14 });
      setPhase("Complete");
      return;
    }
    let i = 0;
    const interval = setInterval(() => {
      if (i >= LOG_LINES.length) {
        clearInterval(interval);
        setProgress(100);
        setPhase("Complete");
        onDone && onDone();
        return;
      }
      setLogs((prev) => [...prev, LOG_LINES[i]]);
      const pct = Math.round(((i + 1) / LOG_LINES.length) * 100);
      setProgress(pct);

      // Phase labels
      if (i < 2) setPhase("Inventorying dependencies");
      else if (i < 5) setPhase("Pulling evidence sources");
      else if (i < 9) setPhase("Mapping Annex III obligations");
      else if (i < 12) setPhase("Detecting policy gaps");
      else setPhase("Computing compliance score");

      // Counters tick
      setCounters((c) => ({
        deps: Math.min(247, c.deps + Math.round(247 / LOG_LINES.length) + 5),
        ai: Math.min(6, i >= 2 ? Math.min(6, c.ai + 1) : 0),
        tickets: Math.min(412, c.tickets + Math.round(412 / LOG_LINES.length) + 4),
        obligations: Math.min(14, i >= 6 ? Math.min(14, c.obligations + 2) : 0),
      }));
      i++;
    }, 380);
    return () => clearInterval(interval);
  }, [done]);

  useEffectScan(() => {
    if (logBoxRef.current) logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
  }, [logs]);

  return (
    <div>
      <PageTitle
        eyebrow="STEP 02 · SCANNING"
        title={isDone ? "Scan complete." : "Scanning your stack."}
        subtitle={isDone
          ? "23.4 seconds. 14 obligations mapped, 6 AI components inventoried. Open the risk map to see what we found."
          : "We're inventorying dependencies, pulling evidence from your connectors, and mapping each finding to Annex III obligations."}
        right={
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            <div className="meta-pill" style={{ background: isDone ? "var(--volt-soft)" : "var(--bone-100)", borderColor: isDone ? "oklch(82% 0.10 128)" : "var(--bone-300)" }}>
              <span className="chip-dot" style={{ background: isDone ? "oklch(55% 0.18 128)" : "var(--ink-700)", animation: isDone ? "none" : "pulse 1.2s ease-in-out infinite" }} />
              <span style={{ color: isDone ? "oklch(40% 0.16 128)" : "var(--ink-700)" }}>{phase}</span>
            </div>
            <div className="t-mono" style={{ fontSize: 11, color: "var(--ink-500)" }}>{progress}% · scn_8f3a</div>
          </div>
        }
      />

      {/* Progress */}
      <div style={{ marginBottom: 32 }}>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%`, background: isDone ? "var(--volt)" : "var(--ink-900)" }} />
        </div>
      </div>

      {/* Counters */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <Counter label="Dependencies" value={counters.deps} max={247} />
        <Counter label="AI components" value={counters.ai} max={6} flagged />
        <Counter label="Jira tickets" value={counters.tickets} max={412} />
        <Counter label="Obligations matched" value={counters.obligations} max={14} flagged />
      </div>

      {/* Terminal */}
      <div style={{ background: "#0B0D10", borderRadius: "var(--r-lg)", overflow: "hidden", border: "1px solid #1A1D22" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #1A1D22" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F57" }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FEBC2E" }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#28C840" }} />
          </div>
          <div className="t-mono" style={{ fontSize: 11, color: "#9096A0", letterSpacing: "0.05em" }}>integreat://scan/scn_8f3a — live log</div>
          <div className="t-mono" style={{ fontSize: 11, color: "#9096A0" }}>{logs.length} lines</div>
        </div>
        <div ref={logBoxRef} style={{ padding: 18, height: 320, overflowY: "auto", fontFamily: "var(--font-mono)", fontSize: 12.5, lineHeight: 1.75, color: "#E8E5DD" }}>
          {logs.map((l, i) => (
            <div key={i} style={{ display: "flex", gap: 16 }}>
              <span style={{ color: "#7AA0FF", flexShrink: 0 }}>{l.t}</span>
              <span style={{ color: l.color === "ok" ? "#B8E986" : l.color === "warn" ? "#F5C97B" : l.color === "err" ? "#FF8C7A" : "#E8E5DD", flexShrink: 0, width: 130 }}>{l.k}</span>
              <span style={{ color: "#9096A0" }}>{l.v}</span>
            </div>
          ))}
          {!isDone && (
            <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
              <span style={{ color: "#7AA0FF" }}>{new Date().toTimeString().slice(0,8)}</span>
              <span style={{ color: "#E8E5DD" }}>$ <span style={{ animation: "blink 1s step-end infinite" }}>▌</span></span>
            </div>
          )}
        </div>
      </div>

      <BottomNav
        onPrev={() => {}}
        prevLabel="Edit profile"
        onNext={isDone ? onNext : null}
        nextLabel="Open risk map"
        canNext={isDone}
        note={isDone ? "Compliance score · 72 / 100" : `${LOG_LINES.length - logs.length} steps remaining`}
      />

      <style>{`
        @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.4 } }
        @keyframes blink { 50% { opacity: 0 } }
      `}</style>
    </div>
  );
};

const Counter = ({ label, value, max, flagged }) => (
  <div style={{ background: "var(--bone-50)", border: "var(--hairline)", borderRadius: "var(--r-md)", padding: "20px 22px" }}>
    <div className="t-eyebrow" style={{ marginBottom: 10 }}>{label}</div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
      <span className="t-mono t-tabular" style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--ink-900)" }}>{value}</span>
      <span className="t-mono" style={{ fontSize: 13, color: "var(--ink-400)" }}>/ {max}</span>
      {flagged && value === max && <span className="chip chip-indigo" style={{ marginLeft: "auto" }}>flagged</span>}
    </div>
  </div>
);

window.StepScanning = StepScanning;

/* ===== step-risk.jsx ===== */
/* global React, PageTitle, BottomNav */

const { useState: useStateRisk } = React;

/* Risk matrix: obligations × AI systems */
const SYSTEMS = ["Credit scoring", "Fraud v2", "KYC OCR", "Pricing optimizer", "Recommendation"];
const OBLIGATIONS = [
  { id: "art10", label: "Art. 10 · Data governance",       reg: "AI Act" },
  { id: "art13", label: "Art. 13 · Transparency",           reg: "AI Act" },
  { id: "art14", label: "Art. 14 · Human oversight",        reg: "AI Act" },
  { id: "art15", label: "Art. 15 · Accuracy & robustness",  reg: "AI Act" },
  { id: "art22", label: "Art. 22 · Automated decisions",    reg: "RGPD" },
  { id: "art32", label: "Art. 32 · Security of processing", reg: "RGPD" },
  { id: "ict",   label: "ICT Risk Management",              reg: "DORA" },
  { id: "tprm",  label: "Third-party risk",                 reg: "DORA" },
];

// Severity grid (rows = obligations, cols = systems): 0=ok, 1=low, 2=med, 3=high
const GRID = [
  [2, 1, 0, 1, 0],
  [3, 2, 1, 2, 1],
  [3, 1, 0, 1, 2],
  [2, 2, 1, 1, 0],
  [3, 0, 0, 1, 2],
  [1, 1, 1, 1, 1],
  [2, 2, 1, 1, 0],
  [1, 1, 0, 0, 0],
];

const StepRiskMap = ({ onNext, onPrev }) => {
  const [selected, setSelected] = useStateRisk({ row: 2, col: 0 }); // Art.14 × Credit scoring (HIGH)

  return (
    <div>
      <PageTitle
        eyebrow="STEP 03 · RISK MAP"
        title="Where you stand."
        subtitle="Each cell is one obligation × one AI system. Click any HIGH cell to drill into the gap, the evidence, and the proposed fix."
      />

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 24 }}>
        {/* LEFT: score + active regulations */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <ScoreCard />
          <RegulationsCard />
        </div>

        {/* RIGHT: heatmap */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">Obligations × AI systems</h3>
              <div style={{ fontSize: 12.5, color: "var(--ink-500)", marginTop: 2 }}>40 cells · 8 high-risk · click to drill</div>
            </div>
            <div className="tab-row">
              <button className="tab active">Heatmap</button>
              <button className="tab">Table</button>
            </div>
          </div>

          <Heatmap selected={selected} onSelect={setSelected} />
          <DrillDown selected={selected} />
        </div>
      </div>

      <BottomNav onPrev={onPrev} onNext={onNext} nextLabel="Run sandbox tests" note="3 high-risk gaps to remediate" />
    </div>
  );
};

const ScoreCard = () => (
  <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
    <div className="t-eyebrow">Compliance score</div>
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <BigRing value={72} />
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 48, fontWeight: 600, letterSpacing: "-0.025em" }}>72</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, color: "var(--ink-400)" }}>/ 100</span>
        </div>
        <div className="chip chip-indigo" style={{ marginTop: 6 }}>High-risk system</div>
      </div>
    </div>
    <div style={{ borderTop: "var(--hairline)", paddingTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
      <Stat label="High" value="3" tone="high" />
      <Stat label="Medium" value="9" tone="med" />
      <Stat label="OK" value="28" tone="ok" />
    </div>
    <div style={{ fontSize: 12.5, color: "var(--ink-500)", lineHeight: 1.5, borderTop: "var(--hairline)", paddingTop: 14, marginTop: -4 }}>
      Classification follows <span className="t-mono" style={{ fontSize: 11.5 }}>Annex III §5(b)</span> — credit scoring is automatically high-risk.
    </div>
  </div>
);

const Stat = ({ label, value, tone }) => {
  const colorMap = {
    high: { bg: "var(--risk-high-bg)", fg: "oklch(40% 0.18 27)" },
    med:  { bg: "var(--risk-med-bg)",  fg: "oklch(40% 0.14 75)" },
    ok:   { bg: "var(--volt-soft)",    fg: "oklch(40% 0.16 128)" },
  }[tone];
  return (
    <div style={{ background: colorMap.bg, padding: "10px 12px", borderRadius: 8 }}>
      <div className="t-mono t-tabular" style={{ fontSize: 22, fontWeight: 500, color: colorMap.fg, letterSpacing: "-0.02em" }}>{value}</div>
      <div className="t-eyebrow" style={{ color: colorMap.fg, marginTop: 2, fontSize: 10.5 }}>{label}</div>
    </div>
  );
};

const BigRing = ({ value }) => {
  const size = 96;
  const r = 42;
  const c = 2 * Math.PI * r;
  const off = c * (1 - value / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bone-200)" strokeWidth="6" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--ink-900)" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={c} strokeDashoffset={off}
              transform={`rotate(-90 ${size/2} ${size/2})`} />
      {/* tick marks at 25/50/75 */}
      {[0.25, 0.5, 0.75].map((p) => {
        const angle = -Math.PI / 2 + p * 2 * Math.PI;
        const x1 = size/2 + Math.cos(angle) * (r + 4);
        const y1 = size/2 + Math.sin(angle) * (r + 4);
        const x2 = size/2 + Math.cos(angle) * (r + 8);
        const y2 = size/2 + Math.sin(angle) * (r + 8);
        return <line key={p} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--bone-400)" strokeWidth="1" />;
      })}
    </svg>
  );
};

const RegulationsCard = () => (
  <div className="card">
    <div className="card-header">
      <h3 className="card-title">Active regulations</h3>
      <span className="t-mono" style={{ fontSize: 11, color: "var(--ink-500)" }}>3</span>
    </div>
    <div style={{ padding: 4 }}>
      {[
        { name: "EU AI Act",  scope: "Annex III · §5(b)",     deadline: "2 Aug 2026", count: "14 obligations", critical: true },
        { name: "DORA",       scope: "ICT Risk · TPRM",       deadline: "Live",        count: "9 obligations" },
        { name: "RGPD",       scope: "Art. 22 · Art. 32",     deadline: "Live",        count: "6 obligations" },
      ].map((r) => (
        <div key={r.name} style={{ padding: "14px 20px", borderTop: "var(--hairline)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: "-0.005em" }}>{r.name}</div>
            <div className="t-mono" style={{ fontSize: 11, color: "var(--ink-500)", marginTop: 2 }}>{r.scope} · {r.count}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            {r.critical
              ? <span className="chip chip-risk-high">{r.deadline}</span>
              : <span className="t-mono" style={{ fontSize: 11, color: "var(--ink-500)" }}>{r.deadline}</span>}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Heatmap = ({ selected, onSelect }) => {
  const cellSize = 56;
  const labelW = 220;

  return (
    <div style={{ padding: "20px 20px 8px", overflowX: "auto" }}>
      {/* column headers */}
      <div style={{ display: "grid", gridTemplateColumns: `${labelW}px repeat(${SYSTEMS.length}, 1fr)`, gap: 4, marginBottom: 6 }}>
        <div />
        {SYSTEMS.map((s, i) => (
          <div key={i} className="t-eyebrow" style={{ textAlign: "center", fontSize: 10.5, padding: "8px 4px", lineHeight: 1.2 }}>{s}</div>
        ))}
      </div>

      {OBLIGATIONS.map((ob, r) => (
        <div key={ob.id} style={{ display: "grid", gridTemplateColumns: `${labelW}px repeat(${SYSTEMS.length}, 1fr)`, gap: 4, marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingRight: 12 }}>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 500, letterSpacing: "-0.005em" }}>{ob.label.split(" · ")[0]}</div>
              <div className="t-mono" style={{ fontSize: 10.5, color: "var(--ink-500)" }}>{ob.label.split(" · ")[1]}</div>
            </div>
            <span className="t-mono" style={{ fontSize: 10, color: "var(--ink-400)", letterSpacing: "0.08em" }}>{ob.reg}</span>
          </div>
          {GRID[r].map((sev, c) => {
            const isSel = selected.row === r && selected.col === c;
            return (
              <button
                key={c}
                onClick={() => sev > 0 && onSelect({ row: r, col: c })}
                style={{
                  height: cellSize,
                  border: 0,
                  cursor: sev > 0 ? "pointer" : "default",
                  borderRadius: 6,
                  background: cellBg(sev),
                  color: cellFg(sev),
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  letterSpacing: "0.06em",
                  position: "relative",
                  outline: isSel ? "2px solid var(--ink-900)" : "none",
                  outlineOffset: 1,
                  transition: "transform 80ms ease",
                }}
                onMouseDown={(e) => sev > 0 && (e.currentTarget.style.transform = "scale(0.97)")}
                onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                {sev === 0 ? "·" : sev === 1 ? "LOW" : sev === 2 ? "MED" : "HIGH"}
              </button>
            );
          })}
        </div>
      ))}

      <div style={{ display: "flex", gap: 16, padding: "16px 0 4px", marginTop: 12, borderTop: "var(--hairline)" }}>
        <Legend tone="ok" label="OK" />
        <Legend tone="low" label="Low" />
        <Legend tone="med" label="Medium" />
        <Legend tone="high" label="High" />
        <div style={{ flex: 1 }} />
        <span className="t-mono" style={{ fontSize: 11, color: "var(--ink-500)" }}>40 cells · 3 HIGH</span>
      </div>
    </div>
  );
};

const cellBg = (sev) => {
  if (sev === 0) return "var(--bone-100)";
  if (sev === 1) return "oklch(94% 0.06 145)";
  if (sev === 2) return "oklch(93% 0.07 75)";
  return "oklch(90% 0.10 27)";
};
const cellFg = (sev) => {
  if (sev === 0) return "var(--ink-300)";
  if (sev === 1) return "oklch(38% 0.14 145)";
  if (sev === 2) return "oklch(40% 0.14 75)";
  return "oklch(40% 0.18 27)";
};

const Legend = ({ tone, label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
    <span style={{ width: 14, height: 14, borderRadius: 3, background: cellBg(tone === "ok" ? 0 : tone === "low" ? 1 : tone === "med" ? 2 : 3) }} />
    <span className="t-eyebrow" style={{ fontSize: 10.5 }}>{label}</span>
  </div>
);

const DrillDown = ({ selected }) => {
  const ob = OBLIGATIONS[selected.row];
  const sys = SYSTEMS[selected.col];
  const sev = GRID[selected.row][selected.col];
  const sevLabel = sev === 1 ? "Low" : sev === 2 ? "Medium" : "High";

  return (
    <div style={{ borderTop: "var(--hairline)", padding: 24, background: "var(--bone-100)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <span className={`chip ${sev === 3 ? "chip-risk-high" : sev === 2 ? "chip-risk-med" : "chip-risk-low"}`}>{sevLabel}</span>
        <div className="t-mono" style={{ fontSize: 12, color: "var(--ink-700)" }}>{ob.reg.toUpperCase()} · {ob.label}</div>
        <div style={{ flex: 1 }} />
        <div className="t-mono" style={{ fontSize: 11, color: "var(--ink-500)" }}>{sys}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 24 }}>
        <div>
          <div className="t-eyebrow" style={{ marginBottom: 8 }}>Gap</div>
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--ink-800)", lineHeight: 1.5 }}>
            No documented human-in-the-loop for adverse credit decisions. Reviewer override exists in code but is not bound to a policy or audit trail.
          </p>
        </div>
        <div>
          <div className="t-eyebrow" style={{ marginBottom: 8 }}>Evidence</div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
            <li className="t-mono" style={{ fontSize: 11.5, color: "var(--ink-700)" }}>credit-engine/decisions/score.py:142</li>
            <li className="t-mono" style={{ fontSize: 11.5, color: "var(--ink-700)" }}>jira/CRED-318 · open · 14d</li>
            <li className="t-mono" style={{ fontSize: 11.5, color: "var(--ink-700)" }}>policies/oversight.md · missing</li>
          </ul>
        </div>
        <div>
          <div className="t-eyebrow" style={{ marginBottom: 8 }}>Proposed fix</div>
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--ink-800)", lineHeight: 1.5 }}>
            Generate <span className="t-mono" style={{ fontSize: 12 }}>oversight.md</span>, add reviewer SLA, and emit decision events to an immutable audit log.
          </p>
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
            <span className="chip chip-volt">+12 score</span>
            <span className="t-mono" style={{ fontSize: 11, color: "var(--ink-500)" }}>~3 days · 2 PRs</span>
          </div>
        </div>
      </div>
    </div>
  );
};

window.StepRiskMap = StepRiskMap;

/* ===== step-sandbox.jsx ===== */
/* global React, PageTitle, BottomNav */

const { useState: useStateSb } = React;

const TESTS = [
  {
    id: "bias",
    name: "Bias & fairness",
    desc: "Demographic parity across age, nationality, gender",
    runs: 1240,
    pass: 1112,
    findings: [
      { k: "Disparate impact · age 55+", sev: "high",  delta: -8.2, note: "Approval rate 18% vs 26% baseline" },
      { k: "Nationality drift",          sev: "med",   delta: -3.1, note: "5 EU countries underweighted" },
      { k: "Gender parity",              sev: "low",   delta: -0.4, note: "Within tolerance band" },
    ],
  },
  {
    id: "prompt",
    name: "Prompt injection",
    desc: "Adversarial inputs against LLM-backed reviewer",
    runs: 480,
    pass: 421,
    findings: [
      { k: "System prompt leak",  sev: "high", delta: -6.0, note: "Indirect injection via uploaded docs" },
      { k: "Output coercion",     sev: "med",  delta: -2.5, note: "Override of refusal patterns" },
    ],
  },
  {
    id: "robust",
    name: "Robustness",
    desc: "Out-of-distribution and noise resilience",
    runs: 2400,
    pass: 2304,
    findings: [
      { k: "Income field perturbation", sev: "low", delta: -1.0, note: "Score variance acceptable" },
      { k: "Missing-data handling",     sev: "med", delta: -2.2, note: "12% degradation when 3+ fields null" },
    ],
  },
  {
    id: "leak",
    name: "Data leakage",
    desc: "PII exfil & training-data memorization",
    runs: 320,
    pass: 318,
    findings: [
      { k: "Training-set memorization", sev: "low", delta: -0.8, note: "2 / 320 prompts surfaced fragments" },
    ],
  },
];

const StepSandbox = ({ onNext, onPrev }) => {
  const [active, setActive] = useStateSb("bias");
  const test = TESTS.find((t) => t.id === active);

  return (
    <div>
      <PageTitle
        eyebrow="STEP 04 · SANDBOX"
        title="Adversarial tests, in your tenant."
        subtitle="We replay 4,440 synthetic decisions against a sandboxed clone — bias, prompt injection, robustness, leakage. Findings link back to the gaps from the risk map."
        right={
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            <div className="meta-pill" style={{ background: "var(--volt-soft)", borderColor: "oklch(82% 0.10 128)", color: "oklch(40% 0.16 128)" }}>
              <span className="chip-dot" style={{ background: "oklch(55% 0.18 128)" }} />
              <span>4,155 / 4,440 passed</span>
            </div>
            <div className="t-mono" style={{ fontSize: 11, color: "var(--ink-500)" }}>run · 8m 14s · sbx_2c1f</div>
          </div>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24 }}>
        {/* Test list */}
        <div className="card" style={{ padding: 6 }}>
          {TESTS.map((t) => {
            const failed = t.runs - t.pass;
            const isActive = active === t.id;
            return (
              <button key={t.id} onClick={() => setActive(t.id)}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "16px 18px", border: 0, background: isActive ? "var(--ink-900)" : "transparent",
                  color: isActive ? "var(--bone-50)" : "var(--ink-900)",
                  borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
                  marginBottom: 4,
                }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}>{t.name}</span>
                  <span className="t-mono" style={{ fontSize: 10.5, opacity: 0.7 }}>{Math.round((t.pass / t.runs) * 100)}%</span>
                </div>
                <div className="t-mono" style={{ fontSize: 10.5, opacity: isActive ? 0.7 : 0.55 }}>
                  {t.runs} runs · {failed} fails
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">{test.name}</h3>
              <div style={{ fontSize: 12.5, color: "var(--ink-500)", marginTop: 2 }}>{test.desc}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-secondary btn-sm">View runs</button>
              <button className="btn btn-secondary btn-sm">Export JSON</button>
            </div>
          </div>

          {/* Pass rate bar */}
          <div style={{ padding: 24, borderBottom: "var(--hairline)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
              <span className="t-eyebrow">Pass rate</span>
              <span className="t-mono t-tabular" style={{ fontSize: 22, letterSpacing: "-0.015em" }}>
                {test.pass} <span style={{ color: "var(--ink-400)" }}>/ {test.runs}</span>
              </span>
            </div>
            <div style={{ height: 10, background: "var(--bone-200)", borderRadius: 999, overflow: "hidden", display: "flex" }}>
              <div style={{ width: `${(test.pass / test.runs) * 100}%`, background: "var(--volt)" }} />
              <div style={{ flex: 1, background: "var(--risk-high)" }} />
            </div>
          </div>

          {/* Findings */}
          <div style={{ padding: "8px 0" }}>
            {test.findings.map((f, i) => (
              <div key={i} style={{ padding: "16px 24px", borderBottom: i < test.findings.length - 1 ? "var(--hairline)" : 0, display: "grid", gridTemplateColumns: "100px 1fr 100px", gap: 18, alignItems: "center" }}>
                <span className={`chip ${f.sev === "high" ? "chip-risk-high" : f.sev === "med" ? "chip-risk-med" : "chip-risk-low"}`} style={{ width: "fit-content" }}>{f.sev.toUpperCase()}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: "-0.005em" }}>{f.k}</div>
                  <div className="t-mono" style={{ fontSize: 11.5, color: "var(--ink-500)", marginTop: 3 }}>{f.note}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="t-mono t-tabular" style={{ fontSize: 14, color: "oklch(40% 0.18 27)", fontWeight: 500 }}>{f.delta}</div>
                  <div className="t-eyebrow" style={{ fontSize: 10, marginTop: 2 }}>score impact</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Priority fixes */}
      <div style={{ marginTop: 24 }}>
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Priority fixes — projected score impact</h3>
              <div style={{ fontSize: 12.5, color: "var(--ink-500)", marginTop: 2 }}>Apply all three to reach 91 / 100, certifiable under Annex III.</div>
            </div>
            <span className="chip chip-indigo">+19 projected</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
            <FixCard num="01" title="Reweight age cohorts" delta="+8" effort="3 d" linked="Art. 10 · Bias test" />
            <FixCard num="02" title="Add input sanitizer + system-prompt isolation" delta="+6" effort="2 d" linked="Art. 13 · Prompt injection" mid />
            <FixCard num="03" title="Bind reviewer SLA + audit log" delta="+5" effort="3 d" linked="Art. 14 · Oversight" />
          </div>
        </div>
      </div>

      <BottomNav onPrev={onPrev} onNext={onNext} nextLabel="Generate output" note="Projected score · 91 / 100 after fixes" />
    </div>
  );
};

const FixCard = ({ num, title, delta, effort, linked, mid }) => (
  <div style={{ padding: 24, borderLeft: mid ? "var(--hairline)" : "0", borderRight: mid ? "var(--hairline)" : "0" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
      <span className="t-mono" style={{ fontSize: 11, color: "var(--ink-400)" }}>{num}</span>
      <span className="chip chip-volt">{delta} score</span>
    </div>
    <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.012em", marginBottom: 8, lineHeight: 1.3 }}>{title}</div>
    <div className="t-mono" style={{ fontSize: 11, color: "var(--ink-500)" }}>{linked}</div>
    <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span className="t-mono" style={{ fontSize: 11.5, color: "var(--ink-500)" }}>~{effort}</span>
      <button className="btn btn-secondary btn-sm">Add to plan</button>
    </div>
  </div>
);

window.StepSandbox = StepSandbox;

/* ===== step-output.jsx ===== */
/* global React, PageTitle, BottomNav */

const StepOutput = ({ onPrev }) => {
  return (
    <div>
      <PageTitle
        eyebrow="STEP 05 · OUTPUT"
        title="Audit-ready, in three artifacts."
        subtitle="A signed governance policy, a Jira plan engineering will actually run, and a binding insurance quote — all generated from the evidence we just collected."
        right={
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-secondary">Share with auditor</button>
            <button className="btn btn-primary">Sign &amp; export</button>
          </div>
        }
      />

      {/* Cert-readiness gauge */}
      <div className="card" style={{ marginBottom: 24, overflow: "hidden" }}>
        <div style={{ padding: 32, display: "grid", gridTemplateColumns: "1fr 320px", gap: 32, alignItems: "center" }}>
          <div>
            <div className="t-eyebrow" style={{ marginBottom: 12 }}>Certification readiness</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 84, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1 }}>91</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 22, color: "var(--ink-400)" }}>/ 100</span>
              <span className="chip chip-volt" style={{ marginLeft: 16 }}>certifiable</span>
            </div>
            <div style={{ marginTop: 16, fontSize: 14.5, color: "var(--ink-600)", lineHeight: 1.55, maxWidth: 540 }}>
              Up from <span className="t-mono">72</span>. After applying the three priority fixes, this AI system meets Annex III obligations with a 9-point safety margin.
            </div>
            <div style={{ marginTop: 20, display: "flex", gap: 24 }}>
              <Mini label="EU AI Act"  value="14 / 14" tone="ok" />
              <Mini label="DORA"       value="9 / 9"   tone="ok" />
              <Mini label="RGPD"       value="6 / 6"   tone="ok" />
            </div>
          </div>
          <DeltaGauge before={72} after={91} />
        </div>
      </div>

      {/* Three artifacts */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 1fr", gap: 24 }}>
        <PolicyCard />
        <JiraCard />
        <InsuranceCard />
      </div>

      <BottomNav onPrev={onPrev} nextLabel="Restart with new system" onNext={() => {}} note="Run completed · scn_8f3a · Apr 25, 2026" />
    </div>
  );
};

const Mini = ({ label, value, tone }) => (
  <div>
    <div className="t-eyebrow" style={{ marginBottom: 4 }}>{label}</div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
      <span className="t-mono t-tabular" style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-0.015em" }}>{value}</span>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: tone === "ok" ? "var(--volt)" : "var(--ink-400)" }} />
    </div>
  </div>
);

const DeltaGauge = ({ before, after }) => {
  const w = 280, h = 200, cx = w/2, cy = 160, r = 110;
  const arc = (val) => {
    const a = Math.PI - (val / 100) * Math.PI;
    const x = cx + r * Math.cos(a);
    const y = cy - r * Math.sin(a);
    return { x, y, a };
  };
  const beforeP = arc(before);
  const afterP  = arc(after);

  // Arc path (semicircle)
  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {/* track */}
      <path d={arcPath} fill="none" stroke="var(--bone-200)" strokeWidth="14" strokeLinecap="round" />
      {/* before arc */}
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${beforeP.x} ${beforeP.y}`}
            fill="none" stroke="var(--ink-400)" strokeWidth="14" strokeLinecap="round" strokeDasharray="2 6" opacity="0.6" />
      {/* after arc */}
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${afterP.x} ${afterP.y}`}
            fill="none" stroke="var(--volt)" strokeWidth="14" strokeLinecap="round" />
      {/* tick labels */}
      <text x={cx - r - 6} y={cy + 22} textAnchor="end" fontFamily="var(--font-mono)" fontSize="10" fill="var(--ink-400)">0</text>
      <text x={cx} y={28} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fill="var(--ink-400)">50</text>
      <text x={cx + r + 6} y={cy + 22} textAnchor="start" fontFamily="var(--font-mono)" fontSize="10" fill="var(--ink-400)">100</text>
      {/* before marker */}
      <circle cx={beforeP.x} cy={beforeP.y} r="6" fill="var(--bone-50)" stroke="var(--ink-700)" strokeWidth="1.5" />
      <text x={beforeP.x} y={beforeP.y - 14} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fill="var(--ink-600)">before · 72</text>
      {/* after marker */}
      <circle cx={afterP.x} cy={afterP.y} r="8" fill="var(--volt)" stroke="var(--ink-900)" strokeWidth="1.5" />
      <text x={afterP.x} y={afterP.y - 16} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fontWeight="600" fill="var(--ink-900)">after · 91</text>
    </svg>
  );
};

const PolicyCard = () => (
  <div className="card" style={{ overflow: "hidden" }}>
    <div className="card-header">
      <div>
        <h3 className="card-title">Governance policy</h3>
        <div style={{ fontSize: 12.5, color: "var(--ink-500)", marginTop: 2 }}>PDF · 38 pages · auto-generated</div>
      </div>
      <button className="btn btn-secondary btn-sm">Open</button>
    </div>
    <div style={{ padding: 24, background: "var(--bone-100)", display: "flex", justifyContent: "center" }}>
      {/* PDF preview mock */}
      <div style={{ width: "100%", maxWidth: 280, aspectRatio: "0.77", background: "white", boxShadow: "0 1px 0 rgba(0,0,0,0.04), 0 8px 28px rgba(0,0,0,0.08)", borderRadius: 4, padding: "20px 22px", fontSize: 7, color: "var(--ink-800)", lineHeight: 1.5, fontFamily: "var(--font-display)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, borderBottom: "1px solid #eee", paddingBottom: 8 }}>
          <div style={{ fontSize: 6.5, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-500)" }}>integreat · governance</div>
          <div style={{ fontSize: 6.5, fontFamily: "var(--font-mono)", color: "var(--ink-400)" }}>v1.0 · 25 Apr 2026</div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 4 }}>AI Governance Policy</div>
        <div style={{ fontSize: 7.5, color: "var(--ink-500)", marginBottom: 10 }}>Lumen Credit · Credit scoring v3.2</div>
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 6.5, fontWeight: 600, marginBottom: 3, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ink-700)" }}>{i+1}. {["Scope & classification", "Data governance", "Human oversight"][i]}</div>
            {[...Array(4)].map((_, j) => (
              <div key={j} style={{ height: 3, background: j === 3 ? "#eee" : "#ddd", borderRadius: 1, marginBottom: 2.5, width: `${[100,95,98,60][j]}%` }} />
            ))}
          </div>
        ))}
        <div style={{ marginTop: 14, padding: 8, background: "var(--volt-soft)", borderRadius: 2, fontSize: 6, color: "oklch(40% 0.16 128)", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 600 }}>Signed · CTO + DPO · pending</div>
      </div>
    </div>
    <div style={{ padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "var(--hairline)" }}>
      <span className="t-mono" style={{ fontSize: 11, color: "var(--ink-500)" }}>policy_lumen_v1.0.pdf · 1.4 MB</span>
      <span className="chip chip-bone">Awaiting 2 signatures</span>
    </div>
  </div>
);

const JiraCard = () => (
  <div className="card" style={{ overflow: "hidden" }}>
    <div className="card-header">
      <div>
        <h3 className="card-title">Action plan</h3>
        <div style={{ fontSize: 12.5, color: "var(--ink-500)", marginTop: 2 }}>3 epics · 11 stories · pushed to Jira</div>
      </div>
      <button className="btn btn-secondary btn-sm">Open in Jira</button>
    </div>
    <div>
      {[
        { id: "CRED-401", title: "Reweight age cohorts in scoring v3.3", pts: 8,  status: "Ready", owner: "ML" },
        { id: "CRED-402", title: "Sanitize LLM inputs · isolate system prompt", pts: 5, status: "Ready", owner: "Plat" },
        { id: "CRED-403", title: "Bind reviewer SLA + immutable audit log", pts: 13, status: "Ready", owner: "Eng" },
        { id: "CRED-404", title: "Publish model card + datasheets", pts: 3, status: "Ready", owner: "ML" },
        { id: "CRED-405", title: "Quarterly post-market monitoring job", pts: 5, status: "Ready", owner: "Plat" },
      ].map((j, i) => (
        <div key={j.id} style={{ padding: "14px 20px", borderTop: "var(--hairline)", display: "flex", alignItems: "center", gap: 12 }}>
          <span className="t-mono" style={{ fontSize: 11, color: "var(--ink-500)", flexShrink: 0, width: 70 }}>{j.id}</span>
          <span style={{ flex: 1, fontSize: 13, lineHeight: 1.4 }}>{j.title}</span>
          <span className="t-mono" style={{ fontSize: 10.5, color: "var(--ink-500)", flexShrink: 0 }}>{j.pts}pt</span>
          <span className="chip chip-bone" style={{ flexShrink: 0 }}>{j.owner}</span>
        </div>
      ))}
    </div>
    <div style={{ padding: "14px 24px", borderTop: "var(--hairline)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bone-100)" }}>
      <span className="t-mono" style={{ fontSize: 11, color: "var(--ink-500)" }}>34 story pts · ~3 sprints</span>
      <span className="chip chip-volt">Synced</span>
    </div>
  </div>
);

const InsuranceCard = () => (
  <div className="card" style={{ overflow: "hidden", background: "var(--ink-900)", color: "var(--bone-50)", borderColor: "var(--ink-900)" }}>
    <div style={{ padding: 24, borderBottom: "1px solid var(--ink-700)" }}>
      <div className="t-eyebrow" style={{ color: "var(--bone-300)", marginBottom: 8 }}>Insurance quote</div>
      <div style={{ fontSize: 14, color: "var(--bone-200)", lineHeight: 1.4 }}>AI liability cover · €5M aggregate · 12-month term</div>
    </div>
    <div style={{ padding: "32px 24px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 48, fontWeight: 600, letterSpacing: "-0.025em" }}>€2,840</span>
        <span style={{ fontSize: 14, color: "var(--bone-300)" }}>/ month</span>
      </div>
      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
        <span className="chip" style={{ background: "oklch(35% 0.16 128)", color: "var(--volt)", border: 0 }}>−18% vs sector</span>
        <span className="t-mono" style={{ fontSize: 11, color: "var(--bone-300)" }}>score-adjusted</span>
      </div>
    </div>
    <div style={{ padding: "20px 24px", borderTop: "1px solid var(--ink-700)" }}>
      {[
        { k: "Underwriter", v: "Hexa Re · Paris" },
        { k: "Trigger",     v: "Score ≥ 85 · maintained" },
        { k: "Deductible",  v: "€25,000" },
        { k: "Binds in",    v: "48 hours" },
      ].map((r) => (
        <div key={r.k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 12.5 }}>
          <span style={{ color: "var(--bone-300)" }}>{r.k}</span>
          <span className="t-mono" style={{ color: "var(--bone-100)" }}>{r.v}</span>
        </div>
      ))}
    </div>
    <div style={{ padding: 20, borderTop: "1px solid var(--ink-700)" }}>
      <button className="btn btn-lg" style={{ width: "100%", justifyContent: "center", background: "var(--volt)", color: "var(--ink-900)", borderColor: "var(--volt)" }}>
        Bind quote
      </button>
    </div>
  </div>
);

window.StepOutput = StepOutput;
