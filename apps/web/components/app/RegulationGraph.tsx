"use client";
import { useEffect, useMemo, useRef, useState } from "react";

type Node = {
  id: string;
  label: string;
  type: "regulation" | "dimension" | "category";
  weight: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number;
  fy?: number;
};

type Edge = { source: string; target: string; weight: number };

const COLORS: Record<Node["type"], string> = {
  regulation: "#7c5cff",
  dimension: "#38bdf8",
  category: "#f472b6",
};

export default function RegulationGraph() {
  const [data, setData] = useState<{
    nodes: Node[];
    edges: Edge[];
  } | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | Node["type"]>("all");
  const svgRef = useRef<SVGSVGElement>(null);
  const tickRef = useRef<number | null>(null);
  const draggingRef = useRef<string | null>(null);

  // Fetch + initial layout
  useEffect(() => {
    let alive = true;
    fetch("/api/graph", { cache: "no-store" })
      .then((r) => r.json())
      .then((raw) => {
        if (!alive) return;
        const W = 800;
        const H = 520;
        const R = Math.min(W, H) / 2 - 40;
        const cx = W / 2;
        const cy = H / 2;

        const nodes: Node[] = (raw.nodes || []).map((n: any, i: number, arr: any[]) => {
          // Initial layout: regulations in inner ring, dims in mid, cats in outer.
          const ring =
            n.type === "regulation" ? 0.25 : n.type === "dimension" ? 0.55 : 0.95;
          const groupArr = arr.filter((x: any) => x.type === n.type);
          const idx = groupArr.findIndex((x: any) => x.id === n.id);
          const angle = (idx / Math.max(1, groupArr.length)) * 2 * Math.PI;
          return {
            ...n,
            x: cx + Math.cos(angle) * R * ring,
            y: cy + Math.sin(angle) * R * ring,
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
    const W = 800;
    const H = 520;
    const cx = W / 2;
    const cy = H / 2;

    const nodeMap = new Map(data.nodes.map((n) => [n.id, n]));

    const step = () => {
      const k_repulse = 1800;
      const k_spring = 0.012;
      const k_center = 0.0008;
      const damping = 0.86;

      // Repulsion (O(n²), fine for ~30 nodes)
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
      // Springs (edges)
      for (const e of data.edges) {
        const a = nodeMap.get(e.source);
        const b = nodeMap.get(e.target);
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const target = 120;
        const f = (d - target) * k_spring;
        const fx = (dx / d) * f;
        const fy = (dy / d) * f;
        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
      }
      // Gravity to center
      for (const n of data.nodes) {
        n.vx += (cx - n.x) * k_center;
        n.vy += (cy - n.y) * k_center;
      }
      // Integrate
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

  const onMouseDown = (id: string) => {
    draggingRef.current = id;
  };
  const onMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const id = draggingRef.current;
    if (!id || !data || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 800;
    const y = ((e.clientY - rect.top) / rect.height) * 520;
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
      <div className="card p-6 text-[12.5px] text-white/55">
        Loading regulatory graph…
      </div>
    );
  }

  if (data.nodes.length === 0) {
    return (
      <div className="card p-6 text-[12.5px] text-white/55">
        No data yet — ingest a regulation to populate the graph.
      </div>
    );
  }

  const maxW = Math.max(1, ...data.nodes.map((n) => n.weight));
  const radius = (n: Node) =>
    n.type === "regulation" ? 14 + Math.min(10, n.weight / 50) : 4 + (n.weight / maxW) * 10;

  return (
    <div className="card-elevated p-5">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
        <div>
          <div className="pill">live</div>
          <h2 className="text-[18px] font-semibold mt-2">Regulatory knowledge graph</h2>
          <p className="text-[12.5px] text-white/55 mt-1 max-w-xl">
            All four regulations linked through the risk dimensions and categories extracted by
            Gemini. Drag nodes, hover for details. Edge thickness = obligation count.
          </p>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {(
            [
              ["all", "all"],
              ["regulation", "regulations"],
              ["dimension", "dimensions"],
              ["category", "categories"],
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

      <svg
        ref={svgRef}
        viewBox="0 0 800 520"
        className="w-full h-[520px] rounded-xl bg-[radial-gradient(ellipse_at_top,_rgba(124,92,255,0.08),_transparent_60%)] border border-white/[0.05]"
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {/* edges */}
        {data.edges.map((e, i) => {
          const a = data.nodes.find((n) => n.id === e.source);
          const b = data.nodes.find((n) => n.id === e.target);
          if (!a || !b) return null;
          if (filter !== "all" && b.type !== filter && a.type !== filter) return null;
          const highlighted = hover && (hover === e.source || hover === e.target);
          const w = Math.max(0.6, Math.min(4, e.weight / 30));
          return (
            <line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={highlighted ? "#fff" : "rgba(255,255,255,0.08)"}
              strokeWidth={highlighted ? w + 0.6 : w}
            />
          );
        })}
        {/* nodes */}
        {visibleNodes.map((n) => {
          const r = radius(n);
          const highlighted = hover === n.id;
          return (
            <g
              key={n.id}
              onMouseEnter={() => setHover(n.id)}
              onMouseLeave={() => setHover(null)}
              onMouseDown={() => onMouseDown(n.id)}
              style={{ cursor: "grab" }}
            >
              <circle
                cx={n.x}
                cy={n.y}
                r={r}
                fill={COLORS[n.type]}
                fillOpacity={highlighted ? 0.95 : 0.65}
                stroke={highlighted ? "#fff" : "rgba(255,255,255,0.15)"}
                strokeWidth={highlighted ? 1.4 : 0.8}
              />
              {(n.type === "regulation" || highlighted) && (
                <text
                  x={n.x}
                  y={n.y + r + 12}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.85)"
                  fontSize={n.type === "regulation" ? 11 : 10}
                  fontWeight={n.type === "regulation" ? 600 : 400}
                  pointerEvents="none"
                >
                  {n.label.length > 22 ? n.label.slice(0, 22) + "…" : n.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="flex flex-wrap items-center gap-3 mt-3 text-[11.5px] text-white/55">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full inline-block"
            style={{ background: COLORS.regulation }}
          />
          regulation
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full inline-block"
            style={{ background: COLORS.dimension }}
          />
          risk dimension
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full inline-block"
            style={{ background: COLORS.category }}
          />
          risk category
        </span>
      </div>
    </div>
  );
}
