"use client";
import { useEffect, useMemo, useRef, useState } from "react";

type NodeType = "regulation" | "dimension" | "category" | "article";

type Node = {
  id: string;
  label: string;
  type: NodeType;
  weight: number;
  severity?: string;
  statement?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number;
  fy?: number;
};

type Edge = { source: string; target: string; weight: number; kind?: string };

const COLORS: Record<NodeType, string> = {
  regulation: "oklch(58% 0.18 268)",   // indigo
  dimension:  "oklch(60% 0.14 230)",   // sky
  category:   "#D97757",               // orange
  article:    "oklch(48% 0.06 250)",   // ink-ish blue (low severity)
};

const SEVERITY_COLORS: Record<string, string> = {
  HIGH:   "oklch(62% 0.20 27)",
  MEDIUM: "oklch(70% 0.18 75)",
  LOW:    "oklch(60% 0.14 145)",
};

export default function RegulationGraph() {
  const [data, setData] = useState<{ nodes: Node[]; edges: Edge[] } | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | NodeType>("all");
  const svgRef = useRef<SVGSVGElement>(null);
  const tickRef = useRef<number | null>(null);
  const draggingRef = useRef<string | null>(null);

  const W = 900;
  const H = 560;

  // Fetch + initial layout
  useEffect(() => {
    let alive = true;
    fetch("/api/graph", { cache: "no-store" })
      .then((r) => r.json())
      .then((raw) => {
        if (!alive) return;
        const cx = W / 2;
        const cy = H / 2;
        const Rmax = Math.min(W, H) / 2 - 30;

        const nodes: Node[] = (raw.nodes || []).map((n: any, _i: number, arr: any[]) => {
          const ring =
            n.type === "regulation" ? 0.18 :
            n.type === "dimension"  ? 0.55 :
            n.type === "category"   ? 0.9 :
            /* article */              0.38;
          const groupArr = arr.filter((x: any) => x.type === n.type);
          const idx = groupArr.findIndex((x: any) => x.id === n.id);
          const angle = (idx / Math.max(1, groupArr.length)) * 2 * Math.PI;
          const jitter = (n.id.charCodeAt(0) % 7) - 3;
          return {
            ...n,
            x: cx + Math.cos(angle) * Rmax * ring + jitter,
            y: cy + Math.sin(angle) * Rmax * ring + jitter,
            vx: 0,
            vy: 0,
          };
        });
        setData({ nodes, edges: raw.edges || [] });
      });
    return () => {
      alive = false;
    };
  }, []);

  // Force simulation tick
  useEffect(() => {
    if (!data) return;
    const cx = W / 2;
    const cy = H / 2;
    const nodeMap = new Map(data.nodes.map((n) => [n.id, n]));

    const step = () => {
      const k_repulse = 1500;
      const k_spring = 0.014;
      const k_center = 0.0009;
      const damping = 0.86;

      for (let i = 0; i < data.nodes.length; i++) {
        const a = data.nodes[i];
        if (a.fx !== undefined && a.fy !== undefined) continue;
        for (let j = i + 1; j < data.nodes.length; j++) {
          const b = data.nodes[j];
          let dx = a.x - b.x;
          let dy = a.y - b.y;
          let d2 = dx * dx + dy * dy;
          if (d2 < 1) d2 = 1;
          const f = k_repulse / d2;
          const d = Math.sqrt(d2);
          const fx = (dx / d) * f;
          const fy = (dy / d) * f;
          a.vx += fx;
          a.vy += fy;
          b.vx -= fx;
          b.vy -= fy;
        }
      }
      for (const e of data.edges) {
        const a = nodeMap.get(e.source);
        const b = nodeMap.get(e.target);
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const target =
          e.kind === "contains" ? 75 :
          e.kind === "in"       ? 95 :
          e.kind === "co_occurs"? 130 :
                                  110;
        const f = (d - target) * k_spring;
        const fx = (dx / d) * f;
        const fy = (dy / d) * f;
        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
      }
      for (const n of data.nodes) {
        n.vx += (cx - n.x) * k_center;
        n.vy += (cy - n.y) * k_center;
      }
      for (const n of data.nodes) {
        if (n.fx !== undefined && n.fy !== undefined) {
          n.x = n.fx;
          n.y = n.fy;
          n.vx = 0;
          n.vy = 0;
          continue;
        }
        n.vx *= damping;
        n.vy *= damping;
        n.x = Math.max(20, Math.min(W - 20, n.x + n.vx));
        n.y = Math.max(20, Math.min(H - 20, n.y + n.vy));
      }
      setData((prev) => (prev ? { ...prev } : prev));
      tickRef.current = requestAnimationFrame(step);
    };
    tickRef.current = requestAnimationFrame(step);
    return () => {
      if (tickRef.current) cancelAnimationFrame(tickRef.current);
    };
  }, [data?.nodes.length, data?.edges.length]);

  const visibleNodes = useMemo(
    () =>
      data
        ? data.nodes.filter((n) => filter === "all" || n.type === filter || n.type === "regulation")
        : [],
    [data, filter],
  );

  const hoveredNode = useMemo(() => data?.nodes.find((n) => n.id === hover) ?? null, [hover, data]);

  // neighbors for hover highlight
  const neighborSet = useMemo(() => {
    if (!hover || !data) return new Set<string>();
    const s = new Set<string>([hover]);
    for (const e of data.edges) {
      if (e.source === hover) s.add(e.target);
      if (e.target === hover) s.add(e.source);
    }
    return s;
  }, [hover, data]);

  const onMouseDown = (id: string) => {
    draggingRef.current = id;
  };
  const onMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const id = draggingRef.current;
    if (!id || !data || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    const n = data.nodes.find((n) => n.id === id);
    if (n) {
      n.fx = x;
      n.fy = y;
    }
  };
  const onMouseUp = () => {
    if (draggingRef.current && data) {
      const n = data.nodes.find((nn) => nn.id === draggingRef.current);
      if (n) {
        n.fx = undefined;
        n.fy = undefined;
      }
    }
    draggingRef.current = null;
  };

  if (!data) {
    return (
      <div className="card p-6 text-[12.5px]" style={{ color: "var(--ink-500)" }}>
        Loading regulatory graph…
      </div>
    );
  }
  if (data.nodes.length === 0) {
    return (
      <div className="card p-6 text-[12.5px]" style={{ color: "var(--ink-500)" }}>
        No data yet — ingest a regulation to populate the graph.
      </div>
    );
  }

  const maxW = Math.max(1, ...data.nodes.map((n) => n.weight));
  const radius = (n: Node) =>
    n.type === "regulation" ? 16 + Math.min(10, n.weight / 50) :
    n.type === "article"    ? 4.5 :
                              5 + (n.weight / maxW) * 10;

  const nodeColor = (n: Node) =>
    n.type === "article" ? SEVERITY_COLORS[n.severity || "LOW"] || COLORS.article : COLORS[n.type];

  const counts = {
    regulation: data.nodes.filter((n) => n.type === "regulation").length,
    dimension: data.nodes.filter((n) => n.type === "dimension").length,
    category: data.nodes.filter((n) => n.type === "category").length,
    article: data.nodes.filter((n) => n.type === "article").length,
  };

  return (
    <div className="card-elevated p-5">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
        <div>
          <span className="pill">live · {data.nodes.length} nodes · {data.edges.length} edges</span>
          <h2 className="text-[18px] font-semibold mt-2">Regulatory knowledge graph</h2>
          <p className="text-[12.5px] mt-1 max-w-xl" style={{ color: "var(--ink-500)" }}>
            Each regulation linked to its risk dimensions, risk categories, and top obligations
            extracted by Gemini. Hover an article to see its full statement; drag any node.
          </p>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {(
            [
              ["all", "all"],
              ["regulation", `regulations · ${counts.regulation}`],
              ["dimension", `dimensions · ${counts.dimension}`],
              ["category", `categories · ${counts.category}`],
              ["article", `articles · ${counts.article}`],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              className={`chip ${filter === k ? "chip-violet" : ""}`}
              onClick={() => setFilter(k as any)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full rounded-lg"
          style={{
            height: H,
            background:
              "radial-gradient(ellipse at top, rgba(217,119,87,0.06), transparent 60%), var(--bone-100)",
            border: "1px solid var(--bone-300)",
          }}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          {/* edges */}
          {data.edges.map((e, i) => {
            const a = data.nodes.find((n) => n.id === e.source);
            const b = data.nodes.find((n) => n.id === e.target);
            if (!a || !b) return null;
            if (filter !== "all" && b.type !== filter && a.type !== filter && b.type !== "regulation" && a.type !== "regulation") return null;
            const highlighted = hover ? neighborSet.has(a.id) && neighborSet.has(b.id) : false;
            const fade = hover && !highlighted;
            const w = e.kind === "contains" ? 0.7 : Math.max(0.5, Math.min(2.4, e.weight / 25));
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={highlighted ? "var(--ink-900)" : fade ? "rgba(11,13,16,0.06)" : "rgba(11,13,16,0.18)"}
                strokeWidth={highlighted ? w + 0.6 : w}
                strokeDasharray={e.kind === "co_occurs" ? "3 3" : undefined}
              />
            );
          })}
          {/* nodes */}
          {visibleNodes.map((n) => {
            const r = radius(n);
            const isHover = hover === n.id;
            const fade = hover && !neighborSet.has(n.id);
            return (
              <g
                key={n.id}
                onMouseEnter={() => setHover(n.id)}
                onMouseLeave={() => setHover(null)}
                onMouseDown={() => onMouseDown(n.id)}
                style={{ cursor: "grab", opacity: fade ? 0.25 : 1 }}
              >
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={r}
                  fill={nodeColor(n)}
                  fillOpacity={isHover ? 1 : 0.92}
                  stroke={isHover ? "var(--ink-900)" : "rgba(11,13,16,0.25)"}
                  strokeWidth={isHover ? 1.5 : 0.7}
                />
                {(n.type === "regulation" || n.type === "dimension" || isHover) && (
                  <text
                    x={n.x}
                    y={n.y + r + 12}
                    textAnchor="middle"
                    fill="var(--ink-800)"
                    fontSize={n.type === "regulation" ? 12 : 10.5}
                    fontWeight={n.type === "regulation" ? 600 : 500}
                    pointerEvents="none"
                  >
                    {n.label.length > 26 ? n.label.slice(0, 26) + "…" : n.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {hoveredNode?.type === "article" && hoveredNode.statement && (
          <div
            className="absolute top-3 right-3 max-w-[340px] card p-3 text-[12px]"
            style={{ background: "var(--bone-50)" }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className="chip"
                style={{
                  background: SEVERITY_COLORS[hoveredNode.severity || "LOW"] + "22",
                  color: SEVERITY_COLORS[hoveredNode.severity || "LOW"],
                  borderColor: SEVERITY_COLORS[hoveredNode.severity || "LOW"] + "55",
                }}
              >
                {hoveredNode.severity || "LOW"}
              </span>
              <span className="t-mono text-[10.5px]" style={{ color: "var(--ink-500)" }}>
                {hoveredNode.id.replace("O:", "")}
              </span>
            </div>
            <p style={{ color: "var(--ink-700)", lineHeight: 1.5, margin: 0 }}>
              {hoveredNode.statement}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 mt-3 text-[11.5px]" style={{ color: "var(--ink-500)" }}>
        <Legend color={COLORS.regulation} label="regulation" />
        <Legend color={COLORS.dimension} label="risk dimension" />
        <Legend color={COLORS.category} label="risk category" />
        <Legend color={SEVERITY_COLORS.HIGH} label="article · high" />
        <Legend color={SEVERITY_COLORS.MEDIUM} label="article · medium" />
        <Legend color={SEVERITY_COLORS.LOW} label="article · low" />
        <span className="t-mono ml-auto" style={{ color: "var(--ink-400)" }}>
          dashed = dim ↔ cat co-occurrence
        </span>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full inline-block" style={{ background: color }} />
      {label}
    </span>
  );
}
