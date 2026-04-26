"use client";
import { useState } from "react";

type NodeKind = "question" | "policy" | "outcome";
type DTNode = {
  id: string;
  label: string;
  kind: NodeKind;
  desc?: string;
  yes?: string;
  no?: string;
  tag?: string;
  tone?: "violet" | "sky" | "emerald" | "amber" | "pink";
};

const TREE: DTNode[] = [
  {
    id: "q1",
    label: "Does the agent process personal data?",
    kind: "question",
    yes: "q2",
    no: "q3",
    tone: "violet",
  },
  {
    id: "q2",
    label: "Is it special-category data?",
    kind: "question",
    desc: "GDPR Art. 9 — health, biometrics, race, religion…",
    yes: "p_dpia",
    no: "p_gdpr_basic",
    tone: "violet",
  },
  {
    id: "q3",
    label: "Does the agent take autonomous decisions?",
    kind: "question",
    desc: "Risk gate for AI Act Art. 14 (human oversight).",
    yes: "q4",
    no: "p_basic",
    tone: "sky",
  },
  {
    id: "q4",
    label: "Does it operate in a high-risk domain?",
    kind: "question",
    desc: "Annex III — biometric, employment, education, critical infra…",
    yes: "p_aiact_hr",
    no: "p_aiact_lr",
    tone: "amber",
  },
  {
    id: "p_dpia",
    label: "DPIA + GDPR full compliance",
    kind: "policy",
    desc: "Mandatory DPIA, encryption at rest, opt-in consent flow, retention ≤ 24m.",
    tag: "GDPR Art. 35",
    tone: "pink",
  },
  {
    id: "p_gdpr_basic",
    label: "GDPR baseline policy",
    kind: "policy",
    desc: "Lawful basis, minimization, audit log of access, ROPA entry.",
    tag: "GDPR",
    tone: "violet",
  },
  {
    id: "p_aiact_hr",
    label: "AI Act high-risk policy",
    kind: "policy",
    desc: "QMS, post-market monitoring, conformity assessment, human-in-the-loop.",
    tag: "AI Act Art. 6 · Annex III",
    tone: "pink",
  },
  {
    id: "p_aiact_lr",
    label: "AI Act limited-risk policy",
    kind: "policy",
    desc: "Transparency obligations (Art. 50), output watermarking for synthetic media.",
    tag: "AI Act Art. 50",
    tone: "sky",
  },
  {
    id: "p_basic",
    label: "Standard governance",
    kind: "policy",
    desc: "Model card, version pinning, rollback plan, incident process.",
    tag: "ISO 42001",
    tone: "emerald",
  },
];

export default function PoliciesPage() {
  const [path, setPath] = useState<string[]>(["q1"]);
  const cur = TREE.find((n) => n.id === path[path.length - 1])!;
  const visited = new Set(path);

  function pick(branch: "yes" | "no") {
    const nxt = branch === "yes" ? cur.yes : cur.no;
    if (!nxt) return;
    setPath([...path, nxt]);
  }

  function reset() {
    setPath(["q1"]);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <div className="pill">step 2 of 3 · govern</div>
          <h1 className="text-[26px] md:text-[28px] font-semibold tracking-tight mt-2">
            <span className="text-gradient">Policy</span> decision tree
          </h1>
          <p className="text-[13.5px] text-white/55 mt-2 max-w-[640px]">
            Navigate visually from a question to the right governance bundle. The right policies
            are then enforced on every agent run — and re-checked when regulations change.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={reset} className="btn-ghost !py-2 !px-3.5 text-[12.5px]">
            <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={1.7}>
              <path d="M4 12a8 8 0 0 1 14-5.5L20 4M20 4v5h-5" />
            </svg>
            Restart wizard
          </button>
          <button className="btn-primary !py-2 !px-3.5 text-[12.5px]">
            <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 5v14M5 12h14" />
            </svg>
            New policy
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Wizard */}
        <div className="card-elevated p-6 lg:col-span-2">
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-white/45 mb-3">
            interactive wizard
          </div>
          {cur.kind === "question" ? (
            <>
              <h2 className="text-[20px] font-semibold tracking-tight">{cur.label}</h2>
              {cur.desc ? (
                <p className="text-[13px] text-white/55 mt-1.5">{cur.desc}</p>
              ) : null}
              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  onClick={() => pick("yes")}
                  className="card glass-hover p-5 text-left group"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-7 w-7 rounded-md bg-emerald-500/20 border border-emerald-500/40 grid place-items-center">
                      <svg viewBox="0 0 24 24" width={14} height={14} stroke="#a7f3d0" strokeWidth={2.5} fill="none">
                        <path d="m5 12 5 5L20 7" />
                      </svg>
                    </span>
                    <span className="text-[14px] font-semibold">Yes</span>
                  </div>
                  <div className="text-[12px] text-white/55 mt-2 group-hover:text-white/80 transition">
                    Branch into stricter requirements →
                  </div>
                </button>
                <button
                  onClick={() => pick("no")}
                  className="card glass-hover p-5 text-left group"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-7 w-7 rounded-md bg-rose-500/15 border border-rose-500/35 grid place-items-center">
                      <svg viewBox="0 0 24 24" width={14} height={14} stroke="#fda4af" strokeWidth={2.5} fill="none">
                        <path d="M6 6l12 12M18 6 6 18" />
                      </svg>
                    </span>
                    <span className="text-[14px] font-semibold">No</span>
                  </div>
                  <div className="text-[12px] text-white/55 mt-2 group-hover:text-white/80 transition">
                    Continue with the lighter branch →
                  </div>
                </button>
              </div>
            </>
          ) : (
            <PolicyResult node={cur} onReset={reset} />
          )}
        </div>

        {/* Tree visualization */}
        <div className="card p-5">
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-white/45 mb-3">
            decision graph
          </div>
          <TreeViz visited={visited} current={cur.id} />
        </div>
      </div>

      {/* Library */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-semibold">Policy library</h2>
          <span className="text-[11.5px] text-white/45">5 active · 3 drafts · last edited 2h ago</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {TREE.filter((n) => n.kind === "policy").map((p) => (
            <div key={p.id} className="card p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between">
                <span className="text-[14.5px] font-semibold">{p.label}</span>
                <span className={`chip chip-${p.tone ?? "violet"}`}>{p.tag}</span>
              </div>
              <div className="text-[12px] text-white/55">{p.desc}</div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[11px] text-white/40 font-mono">v3 · enforced</span>
                <button className="btn-ghost !py-1 !px-2.5 text-[11px]">Edit</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function PolicyResult({ node, onReset }: { node: DTNode; onReset: () => void }) {
  return (
    <div>
      <div className={`chip chip-${node.tone ?? "violet"} mb-3`}>recommended</div>
      <h2 className="text-[22px] font-semibold tracking-tight">{node.label}</h2>
      <p className="text-[13.5px] text-white/65 mt-2">{node.desc}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="chip">{node.tag}</span>
        <span className="chip chip-emerald">auto-mapped</span>
        <span className="chip chip-violet">covers 14 obligations</span>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3">
        <Mini num="14" label="obligations covered" />
        <Mini num="3" label="standards aligned" />
        <Mini num="78%" label="trust uplift" />
      </div>
      <div className="flex gap-2 mt-6">
        <button className="btn-primary !py-2 !px-3.5 text-[12.5px]">Apply policy</button>
        <button onClick={onReset} className="btn-ghost !py-2 !px-3.5 text-[12.5px]">
          Restart
        </button>
      </div>
    </div>
  );
}

function Mini({ num, label }: { num: string; label: string }) {
  return (
    <div className="card p-3 text-center">
      <div className="text-[20px] font-semibold tabular">{num}</div>
      <div className="text-[10.5px] uppercase tracking-wider text-white/45 mt-0.5">{label}</div>
    </div>
  );
}

function TreeViz({ visited, current }: { visited: Set<string>; current: string }) {
  // Layout: simple manual coords
  const POS: Record<string, { x: number; y: number }> = {
    q1: { x: 120, y: 30 },
    q2: { x: 50, y: 110 },
    q3: { x: 195, y: 110 },
    q4: { x: 240, y: 195 },
    p_dpia: { x: 18, y: 195 },
    p_gdpr_basic: { x: 88, y: 195 },
    p_basic: { x: 150, y: 195 },
    p_aiact_lr: { x: 210, y: 280 },
    p_aiact_hr: { x: 270, y: 280 },
  };
  const EDGES: { from: string; to: string }[] = [
    { from: "q1", to: "q2" },
    { from: "q1", to: "q3" },
    { from: "q2", to: "p_dpia" },
    { from: "q2", to: "p_gdpr_basic" },
    { from: "q3", to: "p_basic" },
    { from: "q3", to: "q4" },
    { from: "q4", to: "p_aiact_lr" },
    { from: "q4", to: "p_aiact_hr" },
  ];
  return (
    <svg viewBox="0 0 320 330" className="w-full h-auto">
      <defs>
        <linearGradient id="edgeGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7c5cff" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      {EDGES.map((e) => {
        const a = POS[e.from];
        const b = POS[e.to];
        if (!a || !b) return null;
        const isActive = visited.has(e.from) && visited.has(e.to);
        return (
          <path
            key={`${e.from}-${e.to}`}
            d={`M ${a.x + 24} ${a.y + 14} C ${a.x + 24} ${(a.y + b.y) / 2}, ${b.x + 24} ${
              (a.y + b.y) / 2
            }, ${b.x + 24} ${b.y}`}
            className={isActive ? "tree-edge-active" : "tree-edge"}
          />
        );
      })}
      {Object.entries(POS).map(([id, p]) => {
        const node = TREE.find((n) => n.id === id);
        if (!node) return null;
        const isCur = id === current;
        const isVisited = visited.has(id);
        const fill = isCur
          ? "url(#edgeGrad)"
          : isVisited
          ? "rgba(124,92,255,0.35)"
          : "rgba(255,255,255,0.04)";
        const stroke = isCur ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.15)";
        return (
          <g key={id}>
            <rect x={p.x} y={p.y} width={48} height={28} rx={6} fill={fill} stroke={stroke} />
            <text
              x={p.x + 24}
              y={p.y + 17}
              textAnchor="middle"
              fontSize={9}
              fill={isCur ? "white" : "rgba(255,255,255,0.7)"}
              fontFamily="ui-monospace, monospace"
            >
              {id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
