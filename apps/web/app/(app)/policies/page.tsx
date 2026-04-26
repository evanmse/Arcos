"use client";
import { useState } from "react";
import PoliciesCRUD from "@/components/app/PoliciesCRUD";

type NodeKind = "question" | "policy";
type DTNode = {
  id: string;
  label: string;
  kind: NodeKind;
  desc?: string;
  yes?: string;
  no?: string;
  tag?: string;
  tone?: "violet" | "sky" | "emerald" | "amber" | "pink";
  obligations?: string[];
  trustUplift?: string;
  riskCategories?: string[];
  carriers?: string[];
};

const TREE: DTNode[] = [
  {
    id: "q1",
    label: "Does the agent process personal data?",
    kind: "question",
    desc: "Includes any input that can identify a natural person, even indirectly.",
    yes: "q2",
    no: "q3",
  },
  {
    id: "q2",
    label: "Is it special-category data?",
    kind: "question",
    desc: "GDPR Art. 9 — health, biometrics, race, religion, political opinions…",
    yes: "p_dpia",
    no: "p_gdpr_basic",
  },
  {
    id: "q3",
    label: "Does the agent take autonomous decisions?",
    kind: "question",
    desc: "Risk gate for AI Act Art. 14 (human oversight) and Art. 22 GDPR (automated decisions).",
    yes: "q4",
    no: "p_basic",
  },
  {
    id: "q4",
    label: "Does it operate in a high-risk domain?",
    kind: "question",
    desc: "Annex III — biometrics, employment, education, critical infrastructure, credit scoring, law enforcement…",
    yes: "q5",
    no: "p_aiact_lr",
  },
  {
    id: "q5",
    label: "Is the agent deployed inside a financial institution?",
    kind: "question",
    desc: "DORA + MiCA layer activation — ICT 3rd-party register, threat-led pen tests, prudential cover.",
    yes: "p_dora_aiact",
    no: "p_aiact_hr",
  },
  {
    id: "p_dpia",
    label: "DPIA + GDPR full compliance",
    kind: "policy",
    desc: "Mandatory DPIA prior to launch, encryption at rest (AES-256) and in transit, opt-in consent flow, retention ≤ 24 months, right-to-erasure pipeline, breach SLA 72h to CNIL.",
    tag: "GDPR Art. 35",
    tone: "pink",
    obligations: ["GDPR-35", "GDPR-32", "GDPR-9", "GDPR-17", "GDPR-33"],
    trustUplift: "+18 pts",
    riskCategories: ["DATA_PROTECTION", "AUDIT"],
    carriers: ["MunichRe", "Hiscox"],
  },
  {
    id: "p_gdpr_basic",
    label: "GDPR baseline policy",
    kind: "policy",
    desc: "Lawful basis documented, data minimization, audit log of access, ROPA entry, DPA with all sub-processors, privacy notice updated.",
    tag: "GDPR",
    tone: "violet",
    obligations: ["GDPR-6", "GDPR-5", "GDPR-30", "GDPR-13"],
    trustUplift: "+9 pts",
    riskCategories: ["DATA_PROTECTION"],
    carriers: ["Hiscox"],
  },
  {
    id: "p_aiact_hr",
    label: "AI Act high-risk policy",
    kind: "policy",
    desc: "ISO/IEC 42001 QMS, post-market monitoring, conformity assessment via notified body, technical documentation Annex IV, human-in-the-loop on every decision, EU database registration.",
    tag: "AI Act Art. 6 · Annex III",
    tone: "pink",
    obligations: ["AIACT-6", "AIACT-9", "AIACT-14", "AIACT-15", "AIACT-49", "AIACT-72"],
    trustUplift: "+24 pts",
    riskCategories: ["AI_GOVERNANCE", "HUMAN_OVERSIGHT", "TRANSPARENCY", "AUDIT"],
    carriers: ["MunichRe", "Lloyd's"],
  },
  {
    id: "p_dora_aiact",
    label: "DORA + AI Act high-risk (financial)",
    kind: "policy",
    desc: "Full Annex III bundle + ICT third-party register, TLPT every 3 years, incident classification 4h, exit strategy per critical provider, BCM aligned with EBA Guidelines.",
    tag: "DORA Art. 28 · AI Act",
    tone: "pink",
    obligations: ["DORA-28", "DORA-17", "DORA-25", "AIACT-6", "AIACT-9"],
    trustUplift: "+31 pts",
    riskCategories: ["ICT_RISK", "THIRD_PARTY", "AI_GOVERNANCE", "AUDIT"],
    carriers: ["MunichRe", "Beazley", "Lloyd's"],
  },
  {
    id: "p_aiact_lr",
    label: "AI Act limited-risk policy",
    kind: "policy",
    desc: "Transparency obligations Art. 50, output watermarking for synthetic media, user-facing AI disclosure, deepfake labelling.",
    tag: "AI Act Art. 50",
    tone: "sky",
    obligations: ["AIACT-50", "AIACT-52"],
    trustUplift: "+11 pts",
    riskCategories: ["TRANSPARENCY"],
    carriers: ["Hiscox"],
  },
  {
    id: "p_basic",
    label: "Standard governance",
    kind: "policy",
    desc: "Model card, version pinning, rollback plan, incident process, weekly KPI review, RACI matrix.",
    tag: "ISO 42001",
    tone: "emerald",
    obligations: ["ISO42001-6", "ISO42001-7"],
    trustUplift: "+6 pts",
    riskCategories: ["AI_GOVERNANCE"],
    carriers: ["Hiscox"],
  },
];

type Tab = "wizard" | "mine" | "library";

export default function PoliciesPage() {
  const [tab, setTab] = useState<Tab>("wizard");
  const [path, setPath] = useState<string[]>(["q1"]);
  const [applied, setApplied] = useState<{ ok: boolean; msg: string } | null>(null);
  const [applying, setApplying] = useState(false);
  const cur = TREE.find((n) => n.id === path[path.length - 1])!;
  const visited = new Set(path);

  function pick(branch: "yes" | "no") {
    const nxt = branch === "yes" ? cur.yes : cur.no;
    if (!nxt) return;
    setPath([...path, nxt]);
    setApplied(null);
  }
  function reset() {
    setPath(["q1"]);
    setApplied(null);
  }

  async function applyPolicy(node: DTNode) {
    setApplying(true);
    setApplied(null);
    try {
      const res = await fetch("/api/tenant-policies", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          label: node.label,
          description: node.desc,
          enabled: true,
          mandatory: node.tone === "pink",
          risk_categories: node.riskCategories || [],
          assigned_agents: [],
          weight: node.tone === "pink" ? 9 : node.tone === "amber" ? 7 : 5,
          template_id: node.id,
        }),
      });
      if (res.ok) {
        setApplied({ ok: true, msg: "Policy created — find it in “My policies”." });
      } else {
        const t = await res.text().catch(() => "");
        setApplied({ ok: false, msg: `Failed: ${t.slice(0, 120) || res.status}` });
      }
    } catch (e: any) {
      setApplied({ ok: false, msg: `Network error: ${String(e?.message || e).slice(0, 120)}` });
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <div className="pill">step 2 of 3 · govern</div>
          <h1 className="text-[26px] md:text-[28px] font-semibold tracking-tight mt-2">
            <span style={{ color: "var(--orange)" }}>Policy</span> studio
          </h1>
          <p className="text-[13.5px] mt-2 max-w-[640px]" style={{ color: "var(--ink-600)" }}>
            Build, adopt and enforce AI governance policies. Use the wizard for quick mapping, then
            fine-tune in <span className="t-mono">My policies</span>. Every policy is enforced at
            scoring time — and re-checked when regulations change.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={reset} className="btn-ghost !py-2 !px-3.5 text-[12.5px]">
            <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={1.7}>
              <path d="M4 12a8 8 0 0 1 14-5.5L20 4M20 4v5h-5" />
            </svg>
            Restart wizard
          </button>
        </div>
      </header>

      <div
        className="flex items-center gap-1 p-1 rounded-lg w-fit"
        style={{ background: "var(--bone-100)", border: "1px solid var(--bone-300)" }}
      >
        {([
          { id: "wizard", label: "Wizard" },
          { id: "mine", label: "My policies" },
          { id: "library", label: "Template library" },
        ] as { id: Tab; label: string }[]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-3 py-1.5 text-[12.5px] rounded-md transition-all"
            style={{
              background: tab === t.id ? "var(--bone-50)" : "transparent",
              color: tab === t.id ? "var(--ink-900)" : "var(--ink-500)",
              fontWeight: tab === t.id ? 600 : 500,
              border: tab === t.id ? "1px solid var(--bone-300)" : "1px solid transparent",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "wizard" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card-elevated p-6 lg:col-span-2">
            <div className="t-eyebrow mb-3">interactive wizard · step {path.length}</div>
            {cur.kind === "question" ? (
              <>
                <h2 className="text-[20px] font-semibold tracking-tight">{cur.label}</h2>
                {cur.desc && (
                  <p className="text-[13px] mt-1.5" style={{ color: "var(--ink-600)" }}>
                    {cur.desc}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <BranchButton
                    onClick={() => pick("yes")}
                    label="Yes"
                    sub="Branch into stricter requirements →"
                    tone="emerald"
                  />
                  <BranchButton
                    onClick={() => pick("no")}
                    label="No"
                    sub="Continue with the lighter branch →"
                    tone="sky"
                  />
                </div>
              </>
            ) : (
              <PolicyResult
                node={cur}
                onReset={reset}
                onApply={() => applyPolicy(cur)}
                applying={applying}
                applied={applied}
              />
            )}
          </div>
          <div className="card p-5">
            <div className="t-eyebrow mb-3">decision graph</div>
            <TreeViz visited={visited} current={cur.id} onJump={(id) => setPath([...path, id])} />
            <div className="mt-4 flex flex-col gap-1.5">
              <Legend tone="ink" label="current question" />
              <Legend tone="violet" label="visited" />
              <Legend tone="bone" label="not yet visited" />
            </div>
          </div>
        </div>
      )}

      {tab === "mine" && <PoliciesCRUD />}

      {tab === "library" && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {TREE.filter((n) => n.kind === "policy").map((p) => (
            <div key={p.id} className="card p-4 flex flex-col gap-2.5">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[14.5px] font-semibold leading-tight">{p.label}</span>
                <span className={`chip chip-${p.tone ?? "violet"}`}>{p.tag}</span>
              </div>
              <p className="text-[12.5px]" style={{ color: "var(--ink-600)", lineHeight: 1.5 }}>
                {p.desc}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(p.riskCategories || []).map((c) => (
                  <span key={c} className="chip">
                    {c.toLowerCase().replaceAll("_", " ")}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]" style={{ color: "var(--ink-500)" }}>
                <div>
                  <span className="t-mono">{(p.obligations || []).length}</span> obligations
                </div>
                <div>
                  trust uplift{" "}
                  <span className="t-mono" style={{ color: "var(--ink-900)" }}>
                    {p.trustUplift}
                  </span>
                </div>
              </div>
              {p.carriers && p.carriers.length > 0 && (
                <div className="text-[11px]" style={{ color: "var(--ink-500)" }}>
                  Insurable by{" "}
                  <span style={{ color: "var(--ink-800)" }}>{p.carriers.join(" · ")}</span>
                </div>
              )}
              <div className="mt-auto pt-2 border-t" style={{ borderColor: "var(--bone-300)" }}>
                <button
                  className="btn-secondary !py-1.5 !px-3 text-[11.5px] w-full"
                  onClick={() => applyPolicy(p)}
                  disabled={applying}
                >
                  {applying ? "Adopting…" : "+ Adopt policy"}
                </button>
              </div>
            </div>
          ))}
          {applied && (
            <div
              className="md:col-span-2 lg:col-span-3 card p-3 text-[12.5px]"
              style={{
                background: applied.ok ? "var(--risk-low-bg)" : "var(--risk-high-bg)",
                color: "var(--ink-900)",
              }}
            >
              {applied.msg}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function BranchButton({
  onClick,
  label,
  sub,
  tone,
}: {
  onClick: () => void;
  label: string;
  sub: string;
  tone: "emerald" | "sky";
}) {
  const bg = tone === "emerald" ? "var(--risk-low-bg)" : "var(--bone-100)";
  return (
    <button
      onClick={onClick}
      className="card p-5 text-left transition-colors"
      style={{ background: bg }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--ink-700)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--bone-300)")}
    >
      <div className="text-[14px] font-semibold" style={{ color: "var(--ink-900)" }}>
        {label}
      </div>
      <div className="text-[12px] mt-1.5" style={{ color: "var(--ink-600)" }}>
        {sub}
      </div>
    </button>
  );
}

function PolicyResult({
  node,
  onReset,
  onApply,
  applying,
  applied,
}: {
  node: DTNode;
  onReset: () => void;
  onApply: () => void;
  applying: boolean;
  applied: { ok: boolean; msg: string } | null;
}) {
  return (
    <div>
      <div className={`chip chip-${node.tone ?? "violet"} mb-3`}>recommended bundle</div>
      <h2 className="text-[22px] font-semibold tracking-tight">{node.label}</h2>
      <p className="text-[13.5px] mt-2" style={{ color: "var(--ink-700)" }}>
        {node.desc}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="chip">{node.tag}</span>
        {(node.riskCategories || []).slice(0, 4).map((c) => (
          <span key={c} className="chip chip-violet">
            {c.toLowerCase().replaceAll("_", " ")}
          </span>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3">
        <Mini num={String((node.obligations || []).length)} label="obligations covered" />
        <Mini num={node.trustUplift || "—"} label="trust uplift" />
        <Mini num={String((node.carriers || []).length)} label="insurance carriers" />
      </div>
      {node.carriers && node.carriers.length > 0 && (
        <div className="mt-3 text-[12px]" style={{ color: "var(--ink-600)" }}>
          Insurable by{" "}
          <span className="t-mono" style={{ color: "var(--ink-900)" }}>
            {node.carriers.join(" · ")}
          </span>
        </div>
      )}
      <div className="flex gap-2 mt-6 items-center flex-wrap">
        <button
          onClick={onApply}
          disabled={applying}
          className="btn-primary !py-2 !px-3.5 text-[12.5px]"
        >
          {applying ? "Applying…" : "Apply policy"}
        </button>
        <button onClick={onReset} className="btn-ghost !py-2 !px-3.5 text-[12.5px]">
          Restart
        </button>
        {applied && (
          <span
            className="text-[12px]"
            style={{ color: applied.ok ? "oklch(45% 0.16 145)" : "oklch(50% 0.20 27)" }}
          >
            {applied.msg}
          </span>
        )}
      </div>
    </div>
  );
}

function Mini({ num, label }: { num: string; label: string }) {
  return (
    <div className="card p-3 text-center">
      <div className="text-[20px] font-semibold tabular" style={{ color: "var(--ink-900)" }}>
        {num}
      </div>
      <div className="t-eyebrow mt-0.5">{label}</div>
    </div>
  );
}

function Legend({ tone, label }: { tone: "ink" | "violet" | "bone"; label: string }) {
  const bg =
    tone === "ink"
      ? "var(--ink-900)"
      : tone === "violet"
      ? "var(--indigo-soft)"
      : "var(--bone-200)";
  return (
    <div className="flex items-center gap-2 text-[11.5px]" style={{ color: "var(--ink-600)" }}>
      <span
        className="inline-block w-3 h-3 rounded-sm"
        style={{ background: bg, border: "1px solid var(--bone-300)" }}
      />
      {label}
    </div>
  );
}

function TreeViz({
  visited,
  current,
  onJump,
}: {
  visited: Set<string>;
  current: string;
  onJump: (id: string) => void;
}) {
  const POS: Record<string, { x: number; y: number }> = {
    q1: { x: 190, y: 16 },
    q2: { x: 18, y: 90 },
    q3: { x: 358, y: 90 },
    q4: { x: 358, y: 164 },
    q5: { x: 358, y: 238 },
    p_dpia: { x: 18, y: 164 },
    p_gdpr_basic: { x: 130, y: 164 },
    p_basic: { x: 478, y: 164 },
    p_aiact_lr: { x: 240, y: 238 },
    p_aiact_hr: { x: 240, y: 312 },
    p_dora_aiact: { x: 478, y: 312 },
  };
  const W = 90;
  const H = 38;
  const EDGES: { from: string; to: string; label: string }[] = [
    { from: "q1", to: "q2", label: "yes" },
    { from: "q1", to: "q3", label: "no" },
    { from: "q2", to: "p_dpia", label: "yes" },
    { from: "q2", to: "p_gdpr_basic", label: "no" },
    { from: "q3", to: "q4", label: "yes" },
    { from: "q3", to: "p_basic", label: "no" },
    { from: "q4", to: "q5", label: "yes" },
    { from: "q4", to: "p_aiact_lr", label: "no" },
    { from: "q5", to: "p_dora_aiact", label: "yes" },
    { from: "q5", to: "p_aiact_hr", label: "no" },
  ];
  return (
    <svg viewBox="0 0 580 360" className="w-full h-auto">
      {EDGES.map((e) => {
        const a = POS[e.from];
        const b = POS[e.to];
        if (!a || !b) return null;
        const isActive = visited.has(e.from) && visited.has(e.to);
        const x1 = a.x + W / 2;
        const y1 = a.y + H;
        const x2 = b.x + W / 2;
        const y2 = b.y;
        const my = (y1 + y2) / 2;
        return (
          <g key={`${e.from}-${e.to}`}>
            <path
              d={`M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`}
              fill="none"
              stroke={isActive ? "var(--indigo)" : "#DDD7C9"}
              strokeWidth={isActive ? 1.8 : 1}
            />
            <text
              x={(x1 + x2) / 2}
              y={my - 2}
              textAnchor="middle"
              fontSize={9}
              fill={isActive ? "oklch(45% 0.18 268)" : "rgb(11 13 16 / 0.4)"}
              fontFamily="ui-monospace, monospace"
            >
              {e.label}
            </text>
          </g>
        );
      })}
      {Object.entries(POS).map(([id, p]) => {
        const node = TREE.find((n) => n.id === id);
        if (!node) return null;
        const isCur = id === current;
        const isVisited = visited.has(id);
        const isPolicy = node.kind === "policy";
        const fill = isCur
          ? "rgb(11 13 16)"
          : isVisited
          ? "color-mix(in oklch, oklch(58% 0.18 268) 18%, #FAF8F4)"
          : isPolicy
          ? "#F4F1EB"
          : "#FAF8F4";
        const stroke = isCur ? "rgb(11 13 16)" : "#DDD7C9";
        const textColor = isCur ? "#FAF8F4" : "rgb(11 13 16 / 0.85)";
        const label =
          node.kind === "question"
            ? `Q${id.replace("q", "")}`
            : (node.tag || node.label).split(" ")[0];
        return (
          <g
            key={id}
            style={{ cursor: isVisited ? "pointer" : "default" }}
            onClick={() => isVisited && onJump(id)}
          >
            <rect
              x={p.x}
              y={p.y}
              width={W}
              height={H}
              rx={6}
              fill={fill}
              stroke={stroke}
              strokeWidth={isCur ? 1.5 : 1}
            />
            <text
              x={p.x + W / 2}
              y={p.y + 17}
              textAnchor="middle"
              fontSize={11}
              fontWeight={600}
              fill={textColor}
              fontFamily="Inter, system-ui, sans-serif"
            >
              {label}
            </text>
            <text
              x={p.x + W / 2}
              y={p.y + 29}
              textAnchor="middle"
              fontSize={8.5}
              fill={isCur ? "rgb(250 248 244 / 0.7)" : "rgb(11 13 16 / 0.45)"}
              fontFamily="ui-monospace, monospace"
            >
              {isPolicy ? "policy" : "question"}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
