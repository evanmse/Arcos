import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

// Graph topology:
//   nodes = regulations (4) + risk dimensions + risk categories
//   edges = (regulation)-[mentions]->(dimension|category) weighted by obligation count
export async function GET() {
  const pool = getPool();

  let regs: any[] = [];
  let regDim: any[] = [];
  let regCat: any[] = [];
  try {
    regs = (
      await pool.query(
        `SELECT regulation_id, short_name, title, celex FROM regulations ORDER BY regulation_id`,
      )
    ).rows;

    regDim = (
      await pool.query(
        `SELECT regulation_id,
                COALESCE(NULLIF(dimension, ''), 'LEGAL') AS dimension,
                COUNT(*)::int AS weight
         FROM risk_obligations
         WHERE regulation_id IS NOT NULL
         GROUP BY regulation_id, dimension`,
      )
    ).rows;

    regCat = (
      await pool.query(
        `SELECT regulation_id, category, COUNT(*)::int AS weight
         FROM (
           SELECT regulation_id,
                  jsonb_array_elements_text(risk_categories::jsonb) AS category
           FROM risk_obligations
           WHERE regulation_id IS NOT NULL
             AND risk_categories IS NOT NULL
         ) t
         GROUP BY regulation_id, category`,
      )
    ).rows;
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e?.message || e).slice(0, 200) },
      { status: 500 },
    );
  }

  const nodes: Array<{
    id: string;
    label: string;
    type: "regulation" | "dimension" | "category";
    weight: number;
  }> = [];
  const seen = new Set<string>();
  const add = (n: (typeof nodes)[number]) => {
    if (seen.has(n.id)) return;
    seen.add(n.id);
    nodes.push(n);
  };

  for (const r of regs) {
    add({
      id: `R:${r.regulation_id}`,
      label: r.short_name || r.regulation_id,
      type: "regulation",
      weight: 0,
    });
  }
  for (const r of regDim) {
    add({ id: `D:${r.dimension}`, label: r.dimension, type: "dimension", weight: 0 });
  }
  for (const r of regCat) {
    add({ id: `C:${r.category}`, label: r.category, type: "category", weight: 0 });
  }

  const edges: Array<{ source: string; target: string; weight: number }> = [];
  for (const r of regDim) {
    edges.push({
      source: `R:${r.regulation_id}`,
      target: `D:${r.dimension}`,
      weight: r.weight,
    });
  }
  for (const r of regCat) {
    edges.push({
      source: `R:${r.regulation_id}`,
      target: `C:${r.category}`,
      weight: r.weight,
    });
  }
  // Compute node weight (degree-weighted) for sizing.
  const wmap = new Map<string, number>();
  for (const e of edges) {
    wmap.set(e.source, (wmap.get(e.source) ?? 0) + e.weight);
    wmap.set(e.target, (wmap.get(e.target) ?? 0) + e.weight);
  }
  for (const n of nodes) {
    n.weight = wmap.get(n.id) ?? 0;
  }

  return NextResponse.json({
    nodes,
    edges,
    regulations: regs,
  });
}
