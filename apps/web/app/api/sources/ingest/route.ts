import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getPool } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import { ingestCorpDocument } from "@/lib/ingest";
import { extractText } from "@/lib/extract";

const TENANT = "default";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  const pool = getPool();
  await ensureSchema(pool);

  const url = new URL(req.url);
  const sourceId = url.searchParams.get("source_id");
  if (!sourceId) {
    return NextResponse.json({ error: "source_id required" }, { status: 400 });
  }

  // Validate source exists
  const { rows: srcRows } = await pool.query(
    "SELECT source_id FROM corp_sources WHERE source_id=$1 AND tenant_id=$2",
    [sourceId, TENANT],
  );
  if (srcRows.length === 0) {
    return NextResponse.json({ error: "source not found" }, { status: 404 });
  }

  const ct = req.headers.get("content-type") || "";
  const ingested: Array<{ document_id: string; title: string; chunks: number }> = [];
  let errors: Array<{ name: string; error: string }> = [];

  if (ct.startsWith("multipart/form-data")) {
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
          errors.push({
            name,
            error: "extracted text < 30 chars; paste content as text instead",
          });
          continue;
        }
        const docId = crypto.randomBytes(8).toString("hex");
        const res = await ingestCorpDocument({
          pool,
          sourceId,
          documentId: docId,
          tenantId: TENANT,
          title: name,
          mimeType: f.type || undefined,
          byteSize: buffer.byteLength,
          text,
        });
        ingested.push({ document_id: res.document_id, title: name, chunks: res.chunks });
      } catch (exc: any) {
        errors.push({ name, error: String(exc?.message || exc).slice(0, 200) });
      }
    }
  } else {
    const body = (await req.json()) as { title?: string; text?: string };
    if (!body?.text || body.text.length < 30) {
      return NextResponse.json(
        { error: "text body required (min 30 chars)" },
        { status: 400 },
      );
    }
    const docId = crypto.randomBytes(8).toString("hex");
    try {
      const res = await ingestCorpDocument({
        pool,
        sourceId,
        documentId: docId,
        tenantId: TENANT,
        title: body.title || "untitled",
        text: body.text,
        byteSize: Buffer.byteLength(body.text, "utf-8"),
        mimeType: "text/plain",
      });
      ingested.push({
        document_id: res.document_id,
        title: body.title || "untitled",
        chunks: res.chunks,
      });
    } catch (exc: any) {
      errors.push({ name: body.title || "untitled", error: String(exc?.message || exc).slice(0, 200) });
    }
  }

  return NextResponse.json({ ingested, errors });
}
