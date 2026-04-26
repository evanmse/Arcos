"use client";
import { useMemo } from "react";

type Reg = { id: string; label: string };

const RISK_DIMS = [
  { id: "TRANSPARENCY", color: "#38bdf8" },
  { id: "BIAS", color: "#f472b6" },
  { id: "SECURITY", color: "#f43f5e" },
  { id: "DATA_PROTECTION", color: "#34d399" },
  { id: "HUMAN_OVERSIGHT", color: "#a78bfa" },
  { id: "AUDIT", color: "#fbbf24" },
];

const STANDARDS = [
  { id: "ISO_42001", label: "ISO 42001" },
  { id: "ISO_27001", label: "ISO 27001" },
  { id: "NIST_AI_RMF", label: "NIST AI RMF" },
  { id: "EN_ISO_22989", label: "EN ISO 22989" },
];

const INSURANCE = [
  { id: "MUNICHRE", label: "MunichRe" },
  { id: "AIG", label: "AIG" },
  { id: "AXA", label: "AXA AI Cover" },
];

const REG_LINKS: Record<string, string[]> = {
  ai_act: ["TRANSPARENCY", "BIAS", "HUMAN_OVERSIGHT", "AUDIT"],
  dora: ["SECURITY", "AUDIT"],
  mica: ["TRANSPARENCY", "AUDIT"],
  rgpd: ["DATA_PROTECTION", "TRANSPARENCY"],
  gdpr: ["DATA_PROTECTION", "TRANSPARENCY"],
};

const STANDARD_COVERAGE: Record<string, string[]> = {
  ISO_42001: ["TRANSPARENCY", "AUDIT", "HUMAN_OVERSIGHT"],
  ISO_27001: ["SECURITY"],
  NIST_AI_RMF: ["BIAS", "TRANSPARENCY", "HUMAN_OVERSIGHT"],
  EN_ISO_22989: ["TRANSPARENCY"],
};

const INS_COVERAGE: Record<string, string[]> = {
  MUNICHRE: ["SECURITY", "AUDIT"],
  AIG: ["BIAS", "DATA_PROTECTION"],
  AXA: ["TRANSPARENCY", "HUMAN_OVERSIGHT"],
};

export function KnowledgeGraph({ regulations }: { regulations: Reg[] }) {
  const W = 1100;
  const H = 460;

  const layout = useMemo(() => {
    // 4 columns: regulations, risks, standards, insurance
    const colX = [110, 380, 700, 980];
    const lay: Record<string, { x: number; y: number; r: number; color: string; label: string; kind: string }> = {};
    const regs = regulations.length ? regulations : [{ id: "ai_act", label: "AI Act" }];
    regs.forEach((r, i) => {
      const y = 60 + (i * (H - 120)) / Math.max(regs.length - 1, 1);
      lay[`reg:${r.id}`] = { x: colX[0], y, r: 22, color: "#7c5cff", label: r.label, kind: "reg" };
    });
    RISK_DIMS.forEach((d, i) => {
      const y = 50 + (i * (H - 100)) / (RISK_DIMS.length - 1);
      lay[`risk:${d.id}`] = { x: colX[1], y, r: 16, color: d.color, label: d.id, kind: "risk" };
    });
    STANDARDS.forEach((s, i) => {
      const y = 80 + (i * (H - 160)) / (STANDARDS.length - 1);
      lay[`std:${s.id}`] = { x: colX[2], y, r: 18, color: "#34d399", label: s.label, kind: "std" };
    });
    INSURANCE.forEach((s, i) => {
      const y = 100 + (i * (H - 200)) / (INSURANCE.length - 1);
      lay[`ins:${s.id}`] = { x: colX[3], y, r: 18, color: "#f472b6", label: s.label, kind: "ins" };
    });
    return lay;
  }, [regulations]);

  const edges: { a: string; b: string; color: string }[] = [];
  for (const r of regulations.length ? regulations : [{ id: "ai_act", label: "AI Act" }]) {
    const dims = REG_LINKS[r.id] || ["TRANSPARENCY"];
    for (const d of dims) {
      const dim = RISK_DIMS.find((x) => x.id === d);
      edges.push({ a: `reg:${r.id}`, b: `risk:${d}`, color: dim?.color || "#7c5cff" });
    }
  }
  for (const [sid, dims] of Object.entries(STANDARD_COVERAGE)) {
    for (const d of dims) {
      const dim = RISK_DIMS.find((x) => x.id === d);
      edges.push({ a: `risk:${d}`, b: `std:${sid}`, color: dim?.color || "#34d399" });
    }
  }
  for (const [iid, dims] of Object.entries(INS_COVERAGE)) {
    for (const d of dims) {
      const dim = RISK_DIMS.find((x) => x.id === d);
      edges.push({ a: `risk:${d}`, b: `ins:${iid}`, color: dim?.color || "#f472b6" });
    }
  }

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[820px] h-auto">
        <defs>
          <linearGradient id="kgGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7c5cff" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
          <filter id="kgGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* column labels */}
        {[
          { x: 110, label: "Regulations" },
          { x: 380, label: "Risk dimensions" },
          { x: 700, label: "Standards" },
          { x: 980, label: "Insurance" },
        ].map((c) => (
          <text
            key={c.label}
            x={c.x}
            y={20}
            textAnchor="middle"
            fontSize={10}
            fill="rgba(255,255,255,0.45)"
            style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
          >
            {c.label}
          </text>
        ))}
        {/* edges */}
        {edges.map((e, i) => {
          const a = layout[e.a];
          const b = layout[e.b];
          if (!a || !b) return null;
          const mx = (a.x + b.x) / 2;
          return (
            <path
              key={i}
              d={`M ${a.x + a.r} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x - b.r} ${b.y}`}
              stroke={e.color}
              strokeOpacity={0.35}
              strokeWidth={1.1}
              fill="none"
            />
          );
        })}
        {/* nodes */}
        {Object.entries(layout).map(([id, n]) => (
          <g key={id} filter="url(#kgGlow)">
            <circle cx={n.x} cy={n.y} r={n.r} fill={n.color} fillOpacity={0.18} stroke={n.color} strokeWidth={1.2} />
            <circle cx={n.x} cy={n.y} r={n.r * 0.55} fill={n.color} fillOpacity={0.85} />
            <text
              x={
                n.kind === "reg"
                  ? n.x - n.r - 8
                  : n.kind === "risk"
                  ? n.x
                  : n.x + n.r + 8
              }
              y={n.kind === "risk" ? n.y - n.r - 6 : n.y + 4}
              textAnchor={n.kind === "reg" ? "end" : n.kind === "risk" ? "middle" : "start"}
              fontSize={11}
              fontFamily="ui-sans-serif, system-ui"
              fontWeight={n.kind === "reg" ? 600 : 500}
              fill="rgba(255,255,255,0.85)"
            >
              {n.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
