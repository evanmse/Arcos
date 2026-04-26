import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPool } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import { parseSession } from "@/lib/auth";
import {
  ingestGithub,
  ingestNotion,
  ingestSlack,
  ingestDrive,
} from "@/lib/providers";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const c = await cookies();
  const email = parseSession(c.get("integreat_session")?.value)?.email;
  if (!email) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const body = (await req.json()) as {
    source_id: string;
    provider: "github" | "drive" | "notion" | "slack";
    target?: string; // owner/repo, query, channel_id, folder_id
    limit?: number;
  };
  if (!body.source_id || !body.provider) {
    return NextResponse.json({ error: "source_id and provider required" }, { status: 400 });
  }

  const pool = getPool();
  await ensureSchema(pool);
  const s = await pool.query("SELECT 1 FROM corp_sources WHERE source_id=$1", [body.source_id]);
  if (s.rowCount === 0) {
    return NextResponse.json({ error: "source not found" }, { status: 404 });
  }

  try {
    let results;
    switch (body.provider) {
      case "github":
        results = await ingestGithub(pool, body.source_id, email, body.target ?? "", body.limit ?? 30);
        break;
      case "notion":
        results = await ingestNotion(pool, body.source_id, email, body.target ?? "", body.limit ?? 20);
        break;
      case "slack":
        results = await ingestSlack(pool, body.source_id, email, body.target ?? "", body.limit ?? 200);
        break;
      case "drive":
        results = await ingestDrive(
          pool,
          body.source_id,
          email,
          body.target || null,
          body.limit ?? 25,
        );
        break;
      default:
        return NextResponse.json({ error: "unknown provider" }, { status: 400 });
    }
    await pool.query(
      "UPDATE corp_sources SET last_sync_at=now(), auth_mode='oauth' WHERE source_id=$1",
      [body.source_id],
    );
    return NextResponse.json({
      ingested: results,
      total_chunks: results.reduce((s: number, r: any) => s + r.chunks, 0),
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "provider_ingest_failed", details: String(e?.message ?? e) },
      { status: 502 },
    );
  }
}
