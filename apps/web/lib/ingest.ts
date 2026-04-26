// Generic ingest helper: chunk text, embed via Vertex, persist into corp_chunks.
import crypto from "node:crypto";
import { Pool } from "pg";
import { embedTexts } from "./vertex";

const TARGET_CHARS = 3_500; // ≈ 1000 tokens
const OVERLAP_CHARS = 350;

export function chunkText(text: string): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  if (clean.length <= TARGET_CHARS) return [clean];
  const chunks: string[] = [];
  let i = 0;
  while (i < clean.length) {
    const end = Math.min(i + TARGET_CHARS, clean.length);
    chunks.push(clean.slice(i, end));
    if (end === clean.length) break;
    i = end - OVERLAP_CHARS;
  }
  return chunks;
}

export function sha1(s: string): string {
  return crypto.createHash("sha1").update(s).digest("hex");
}

function toPgVector(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

export type IngestArgs = {
  pool: Pool;
  sourceId: string;
  documentId: string;
  tenantId: string;
  title: string;
  uri?: string;
  mimeType?: string;
  byteSize?: number;
  text: string;
};

export async function ingestCorpDocument(args: IngestArgs): Promise<{
  chunks: number;
  document_id: string;
}> {
  const chunks = chunkText(args.text);
  if (chunks.length === 0) {
    return { chunks: 0, document_id: args.documentId };
  }

  await args.pool.query(
    `INSERT INTO corp_documents (document_id, source_id, tenant_id, title, uri, mime_type, byte_size)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (document_id) DO UPDATE SET title=EXCLUDED.title, uri=EXCLUDED.uri`,
    [
      args.documentId,
      args.sourceId,
      args.tenantId,
      args.title,
      args.uri ?? null,
      args.mimeType ?? null,
      args.byteSize ?? null,
    ],
  );

  // Embed in batches of 5 to stay well below Vertex token cap.
  const embeddings = await embedTexts(chunks);

  // Wipe any previous chunks for this document then re-insert.
  await args.pool.query("DELETE FROM corp_chunks WHERE document_id=$1", [
    args.documentId,
  ]);

  for (let i = 0; i < chunks.length; i++) {
    const chunkId = sha1(`${args.documentId}:${i}`);
    const emb = embeddings[i];
    await args.pool.query(
      `INSERT INTO corp_chunks (chunk_id, document_id, tenant_id, ord, text, token_count, embedding)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        chunkId,
        args.documentId,
        args.tenantId,
        i,
        chunks[i],
        Math.ceil(chunks[i].length / 4),
        emb ? toPgVector(emb) : null,
      ],
    );
  }

  return { chunks: chunks.length, document_id: args.documentId };
}
