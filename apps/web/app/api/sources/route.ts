import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getPool } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";

const TENANT = "default";

export const dynamic = "force-dynamic";

export async function GET() {
  const pool = getPool();
  await ensureSchema(pool);
  const { rows } = await pool.query(
    `SELECT s.source_id, s.kind, s.name, s.status, s.config, s.created_at,
            COALESCE(d.docs, 0)::int  AS documents,
            COALESCE(c.chunks, 0)::int AS chunks
     FROM corp_sources s
     LEFT JOIN (SELECT source_id, COUNT(*) AS docs FROM corp_documents GROUP BY source_id) d ON d.source_id = s.source_id
     LEFT JOIN (
       SELECT cd.source_id, COUNT(cc.*) AS chunks
       FROM corp_documents cd LEFT JOIN corp_chunks cc ON cc.document_id = cd.document_id
       GROUP BY cd.source_id
     ) c ON c.source_id = s.source_id
     WHERE s.tenant_id=$1
     ORDER BY s.created_at DESC`,
    [TENANT],
  );
  return NextResponse.json({ sources: rows });
}

export async function POST(req: Request) {
  const pool = getPool();
  await ensureSchema(pool);
  const body = (await req.json()) as {
    kind: "drive" | "github" | "notion" | "slack" | "upload";
    name: string;
    config?: Record<string, unknown>;
  };
  if (!body?.kind || !body?.name) {
    return NextResponse.json({ error: "kind and name required" }, { status: 400 });
  }
  const id = crypto.randomBytes(8).toString("hex");
  await pool.query(
    `INSERT INTO corp_sources (source_id, tenant_id, kind, name, status, config)
     VALUES ($1,$2,$3,$4,'connected',$5::jsonb)`,
    [id, TENANT, body.kind, body.name, JSON.stringify(body.config ?? {})],
  );
  return NextResponse.json({ source_id: id });
}

export async function DELETE(req: Request) {
  const pool = getPool();
  await ensureSchema(pool);
  const url = new URL(req.url);
  const id = url.searchParams.get("source_id");
  if (!id) {
    return NextResponse.json({ error: "source_id required" }, { status: 400 });
  }
  await pool.query("DELETE FROM corp_sources WHERE source_id=$1 AND tenant_id=$2", [
    id,
    TENANT,
  ]);
  return NextResponse.json({ ok: true });
}
