"use client";
import { useEffect, useState } from "react";

type Step = {
  title: string;
  body: string;
  cta?: { label: string; href: string };
};

const STEPS: Step[] = [
  {
    title: "Welcome to Integreat 👋",
    body:
      "Integreat is the insurance layer for autonomous AI agents. In 5 minutes you'll connect your data, score an agent against EU AI Act / DORA / GDPR / MiCA, and bind a real insurance quote.",
  },
  {
    title: "1. Connect your data",
    body:
      "Drive, GitHub, Notion, Slack — read-only. We chunk + embed everything on Vertex text-embedding-005 and feed the scoring engine.",
    cta: { label: "Open Data & Connections", href: "/data" },
  },
  {
    title: "2. Adopt the right policies",
    body:
      "Run the wizard and answer 3–5 questions. We map your context to the right governance bundle (DPIA, AI Act high-risk, DORA, ISO 42001…).",
    cta: { label: "Open Policy studio", href: "/policies" },
  },
  {
    title: "3. Register & analyze an agent",
    body:
      "Plug a GitHub repo of your agent. Gemini 2.5-Pro reads it against the matched obligations and returns a trust score, a risk class and a verdict.",
    cta: { label: "Open Agents", href: "/agents" },
  },
  {
    title: "4. Bind insurance",
    body:
      "Pick a carrier product (Hiscox, MunichRe, Beazley, Lloyd's) — or get an auto-quote calibrated by Gemini against the agent's profile. Bind once approved.",
    cta: { label: "Open Insurance", href: "/insurance" },
  },
  {
    title: "5. Track the report history",
    body:
      "Every analysis is archived in Reports with full risk matrix, findings, matched obligations and matched policies. Compare runs over time.",
    cta: { label: "Open Reports", href: "/reports" },
  },
];

const KEY = "integreat_onboarding_done_v1";

export default function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const done = localStorage.getItem(KEY);
    if (!done) setOpen(true);
  }, []);

  const close = (markDone = true) => {
    if (markDone && typeof window !== "undefined") {
      localStorage.setItem(KEY, String(Date.now()));
    }
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => {
          setStep(0);
          setOpen(true);
        }}
        title="Restart product tour"
        className="fixed bottom-5 right-5 z-40 rounded-full shadow-lg flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-medium transition-transform hover:scale-[1.03]"
        style={{
          background: "var(--ink-900)",
          color: "var(--bone-50)",
          border: "1px solid var(--ink-900)",
        }}
      >
        <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx={12} cy={12} r={9} />
          <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 1-1 1.7M12 17h.01" />
        </svg>
        Tour
      </button>
    );
  }

  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center p-4"
      style={{ background: "rgba(11,13,16,0.42)", backdropFilter: "blur(4px)" }}
    >
      <div className="card-elevated w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="t-eyebrow">
            step {step + 1} of {STEPS.length}
          </span>
          <button
            onClick={() => close(true)}
            className="text-[18px]"
            style={{ color: "var(--ink-400)" }}
            aria-label="Skip tour"
          >
            ×
          </button>
        </div>

        <div className="flex gap-1 mb-4">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="h-[3px] flex-1 rounded-full transition-colors"
              style={{
                background: i <= step ? "var(--ink-900)" : "var(--bone-200)",
              }}
            />
          ))}
        </div>

        <h3 className="text-[20px] font-semibold tracking-tight">{s.title}</h3>
        <p className="text-[13px] mt-2" style={{ color: "var(--ink-700)", lineHeight: 1.55 }}>
          {s.body}
        </p>

        <div className="flex items-center gap-2 mt-6 flex-wrap">
          {step > 0 && (
            <button
              onClick={() => setStep((x) => Math.max(0, x - 1))}
              className="btn-ghost !py-2 !px-3.5 text-[12.5px]"
            >
              ← Back
            </button>
          )}
          <button
            onClick={() => close(true)}
            className="btn-ghost !py-2 !px-3.5 text-[12.5px]"
            style={{ color: "var(--ink-500)" }}
          >
            Skip
          </button>
          {s.cta && (
            <a
              href={s.cta.href}
              onClick={() => close(true)}
              className="btn-secondary !py-2 !px-3.5 text-[12.5px]"
            >
              {s.cta.label}
            </a>
          )}
          {!isLast ? (
            <button
              onClick={() => setStep((x) => Math.min(STEPS.length - 1, x + 1))}
              className="btn-primary !py-2 !px-3.5 text-[12.5px] ml-auto"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={() => close(true)}
              className="btn-primary !py-2 !px-3.5 text-[12.5px] ml-auto"
            >
              Let&apos;s go ✓
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
