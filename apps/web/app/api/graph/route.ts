import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Graph topology (enriched):
 *   nodes = regulations + dimensions + categories + top obligations (articles)
 *   edges =
 *     (regulation)-[mentions]->(dimension)            weighted by obligation count
 *     (regulation)-[covers]->(category)               weighted by obligation count
 *     (regulation)-[contains]->(article)              for each top obligation
 *     (article)-[in]->(dimension)
 *     (article)-[in]->(category)
 *     (dimension)-[co_occurs]->(category)             weighted by obligation co-occurrence
 */
export async function GET() {
  const pool = getPool();

  let regs: any[] = [];
  let regDim: any[] = [];
  let regCat: any[] = [];
  let topObligations: any[] = [];
  let dimCat: any[] = [];

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

    // Top obligations per regulation — pick highest-priority ones (HIGH severity in sanction or longest text)
    topObligations = (
      await pool.query(
        `SELECT obligation_id, regulation_id, dimension, severity, statement, risk_categories
         FROM (
           SELECT
             id::text AS obligation_id,
             regulation_id,
             COALESCE(NULLIF(dimension, ''), 'LEGAL') AS dimension,
             CASE
               WHEN sanction ILIKE '%criminal%' OR sanction ILIKE '%prohibit%' OR sanction ILIKE '%7%' THEN 'HIGH'
               WHEN sanction IS NOT NULL AND sanction <> '' THEN 'MEDIUM'
               ELSE 'LOW'
             END AS severity,
             text AS statement,
             risk_categories,
             ROW_NUMBER() OVER (
               PARTITION BY regulation_id
               ORDER BY
                 CASE
                   WHEN sanction ILIKE '%criminal%' OR sanction ILIKE '%prohibit%' OR sanction ILIKE '%7%' THEN 1
                   WHEN sanction IS NOT NULL AND sanction <> '' THEN 2
                   ELSE 3
                 END,
                 char_length(COALESCE(text,'')) DESC
             ) AS rk
           FROM risk_obligations
           WHERE regulation_id IS NOT NULL
         ) ranked
         WHERE rk <= 8
         ORDER BY regulation_id, rk`,
      )
    ).rows;

    // Dimension ↔ category co-occurrence (within the same obligation)
    dimCat = (
      await pool.query(
        `SELECT dimension, category, COUNT(*)::int AS weight
         FROM (
           SELECT
             COALESCE(NULLIF(dimension, ''), 'LEGAL') AS dimension,
             jsonb_array_elements_text(risk_categories::jsonb) AS category
           FROM risk_obligations
           WHERE risk_categories IS NOT NULL
         ) t
         GROUP BY dimension, category
         HAVING COUNT(*) >= 2`,
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
    type: "regulation" | "dimension" | "category" | "article";
    weight: number;
    severity?: string;
    statement?: string;
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
  for (const o of topObligations) {
    const label = (o.statement ?? "").trim().split(/\s+/).slice(0, 6).join(" ");
    add({
      id: `O:${o.obligation_id}`,
      label: label || o.obligation_id,
      type: "article",
      weight: 0,
      severity: o.severity || "LOW",
      statement: (o.statement ?? "").slice(0, 220),
    });
  }

  const edges: Array<{ source: string; target: string; weight: number; kind: string }> = [];
  for (const r of regDim) {
    edges.push({
      source: `R:${r.regulation_id}`,
      target: `D:${r.dimension}`,
      weight: r.weight,
      kind: "mentions",
    });
  }
  for (const r of regCat) {
    edges.push({
      source: `R:${r.regulation_id}`,
      target: `C:${r.category}`,
      weight: r.weight,
      kind: "covers",
    });
  }
  for (const o of topObligations) {
    edges.push({
      source: `R:${o.regulation_id}`,
      target: `O:${o.obligation_id}`,
      weight: 1,
      kind: "contains",
    });
    edges.push({
      source: `O:${o.obligation_id}`,
      target: `D:${o.dimension}`,
      weight: 1,
      kind: "in",
    });
    let cats: string[] = [];
    try {
      cats = Array.isArray(o.risk_categories)
        ? o.risk_categories
        : typeof o.risk_categories === "string"
        ? JSON.parse(o.risk_categories)
        : [];
    } catch {
      cats = [];
    }
    for (const c of cats.slice(0, 3)) {
      edges.push({
        source: `O:${o.obligation_id}`,
        target: `C:${c}`,
        weight: 1,
        kind: "in",
      });
    }
  }
  for (const r of dimCat) {
    edges.push({
      source: `D:${r.dimension}`,
      target: `C:${r.category}`,
      weight: r.weight,
      kind: "co_occurs",
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
