import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getPool } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import { extractText } from "@/lib/extract";
import { ingestCorpDocument } from "@/lib/ingest";

const TENANT = "default";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

// GET /api/regulations/[id]/uploads -> list user-attached docs for this regulation
// POST /api/regulations/[id]/uploads (multipart) -> ingest a PDF/MD/TXT into the corpus
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const pool = getPool();
  await ensureSchema(pool);
  const { rows } = await pool.query(
    `SELECT u.upload_id, u.title, u.mime_type, u.byte_size, u.created_at,
            COALESCE(c.chunks, 0)::int AS chunks
     FROM regulation_uploads u
     LEFT JOIN (
       SELECT cd.document_id, COUNT(cc.*) AS chunks
       FROM corp_documents cd LEFT JOIN corp_chunks cc ON cc.document_id = cd.document_id
       GROUP BY cd.document_id
     ) c ON c.document_id = u.upload_id
     WHERE u.regulation_id=$1 AND u.tenant_id=$2
     ORDER BY u.created_at DESC`,
    [id, TENANT],
  );
  return NextResponse.json({ uploads: rows });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const pool = getPool();
  await ensureSchema(pool);

  // Make sure regulation exists.
  const { rows: regRows } = await pool.query(
    "SELECT regulation_id FROM regulations WHERE regulation_id=$1",
    [id],
  );
  if (regRows.length === 0) {
    return NextResponse.json({ error: "regulation not found" }, { status: 404 });
  }

  // Use a synthetic corp_source named "regulation:<id>" so chunks live in the
  // standard corp_chunks table and benefit from the same vector index.
  const sourceId = `reg-${id}`;
  await pool.query(
    `INSERT INTO corp_sources (source_id, tenant_id, kind, name, status)
     VALUES ($1,$2,'upload',$3,'connected')
     ON CONFLICT (source_id) DO NOTHING`,
    [sourceId, TENANT, `Supplementary documents · ${id.toUpperCase()}`],
  );

  const ingested: any[] = [];
  const errors: any[] = [];

  const ct = req.headers.get("content-type") || "";

  // JSON path: ingest a remote URL (HTML / PDF / TXT)
  if (ct.includes("application/json")) {
    const body = (await req.json()) as { url: string; title?: string };
    if (!body?.url) {
      return NextResponse.json({ error: "url required" }, { status: 400 });
    }
    try {
      const r = await fetch(body.url, { redirect: "follow" });
      if (!r.ok) throw new Error(`fetch failed ${r.status}`);
      const ab = await r.arrayBuffer();
      const buffer = Buffer.from(ab);
      const mime = r.headers.get("content-type")?.split(";")[0] || "text/html";
      const guessed = body.title || body.url.split("/").pop() || "remote document";
      const text = await extractText({ buffer, mimeType: mime, name: guessed });
      if (!text || text.length < 30) {
        return NextResponse.json(
          { ingested: [], errors: [{ name: guessed, error: "extracted text < 30 chars" }] },
        );
      }
      const uploadId = crypto.randomBytes(8).toString("hex");
      await pool.query(
        `INSERT INTO regulation_uploads
           (upload_id, regulation_id, tenant_id, title, mime_type, byte_size, text, source_url, kind)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'url')`,
        [uploadId, id, TENANT, guessed, mime, buffer.byteLength, text, body.url],
      );
      const res = await ingestCorpDocument({
        pool,
        sourceId,
        documentId: uploadId,
        tenantId: TENANT,
        title: `[${id.toUpperCase()}] ${guessed}`,
        uri: body.url,
        mimeType: mime,
        byteSize: buffer.byteLength,
        text,
      });
      ingested.push({ upload_id: uploadId, title: guessed, chunks: res.chunks });
      return NextResponse.json({ ingested, errors });
    } catch (exc: any) {
      return NextResponse.json(
        { ingested: [], errors: [{ name: body.url, error: String(exc?.message || exc) }] },
        { status: 502 },
      );
    }
  }

  if (!ct.startsWith("multipart/form-data")) {
    return NextResponse.json({ error: "multipart/form-data or json required" }, { status: 400 });
  }
  const form = await req.formData();
  const files = form.getAll("files");
  for (const f of files) {
    if (!(f instanceof File)) continue;
    const name = f.name || "untitled";
    const ab = await f.arrayBuffer();
    const buffer = Buffer.from(ab);
    try {
      const text = await extractText({
        buffer,
        mimeType: f.type || "application/octet-stream",
        name,
      });
      if (!text || text.length < 30) {
        errors.push({ name, error: "extracted text < 30 chars" });
        continue;
      }
      const uploadId = crypto.randomBytes(8).toString("hex");
      // Persist upload metadata (with full text for audit trail).
      await pool.query(
        `INSERT INTO regulation_uploads
           (upload_id, regulation_id, tenant_id, title, mime_type, byte_size, text)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [uploadId, id, TENANT, name, f.type || null, buffer.byteLength, text],
      );
      // Embed into corp_chunks tied to the synthetic source.
      const res = await ingestCorpDocument({
        pool,
        sourceId,
        documentId: uploadId,
        tenantId: TENANT,
        title: `[${id.toUpperCase()}] ${name}`,
        mimeType: f.type || undefined,
        byteSize: buffer.byteLength,
        text,
      });
      ingested.push({ upload_id: uploadId, title: name, chunks: res.chunks });
    } catch (exc: any) {
      errors.push({ name, error: String(exc?.message || exc).slice(0, 200) });
    }
  }
  return NextResponse.json({ ingested, errors });
}
