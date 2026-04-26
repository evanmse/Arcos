import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import { getPool } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import { parseSession, hashPassword, verifyPassword } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getEmail() {
  const c = await cookies();
  const s = c.get("integreat_session")?.value;
  return parseSession(s)?.email ?? null;
}

export async function GET() {
  const email = await getEmail();
  if (!email) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const pool = getPool();
  await ensureSchema(pool);
  const u = await pool.query(
    "SELECT email, display_name, role, preferences, created_at FROM users WHERE email=$1",
    [email],
  );
  const i = await pool.query(
    `SELECT integration_id, provider, label, metadata, created_at,
            CASE WHEN access_token IS NOT NULL THEN true ELSE false END AS has_token
     FROM user_integrations WHERE user_email=$1 ORDER BY created_at DESC`,
    [email],
  );
  return NextResponse.json({
    me: u.rows[0] ?? { email, display_name: email.split("@")[0], role: "admin", preferences: {} },
    integrations: i.rows,
  });
}

export async function PATCH(req: Request) {
  const email = await getEmail();
  if (!email) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const body = (await req.json()) as Partial<{
    display_name: string;
    preferences: Record<string, any>;
    new_password: string;
    current_password: string;
  }>;
  const pool = getPool();
  await ensureSchema(pool);
  if (body.new_password) {
    const cur = await pool.query("SELECT password_hash FROM users WHERE email=$1", [email]);
    const stored = cur.rows[0]?.password_hash ?? "";
    if (!body.current_password || !verifyPassword(body.current_password, stored)) {
      return NextResponse.json({ error: "wrong current password" }, { status: 400 });
    }
    await pool.query("UPDATE users SET password_hash=$1 WHERE email=$2", [
      hashPassword(body.new_password),
      email,
    ]);
  }
  if (body.display_name !== undefined || body.preferences !== undefined) {
    await pool.query(
      `UPDATE users SET display_name = COALESCE($1, display_name),
                        preferences   = COALESCE($2::jsonb, preferences)
       WHERE email=$3`,
      [
        body.display_name ?? null,
        body.preferences ? JSON.stringify(body.preferences) : null,
        email,
      ],
    );
  }
  return NextResponse.json({ ok: true });
}

// Save an integration token (provider creds)
export async function POST(req: Request) {
  const email = await getEmail();
  if (!email) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const body = (await req.json()) as {
    provider: string;
    label?: string;
    access_token: string;
    metadata?: Record<string, any>;
  };
  if (!body.provider || !body.access_token) {
    return NextResponse.json({ error: "provider and access_token required" }, { status: 400 });
  }
  const pool = getPool();
  await ensureSchema(pool);
  const id = "int-" + crypto.randomBytes(6).toString("hex");
  await pool.query(
    `INSERT INTO user_integrations
       (integration_id, user_email, provider, label, access_token, metadata)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb)`,
    [
      id,
      email,
      body.provider,
      body.label ?? body.provider,
      body.access_token,
      JSON.stringify(body.metadata ?? {}),
    ],
  );
  return NextResponse.json({ integration_id: id });
}

export async function DELETE(req: Request) {
  const email = await getEmail();
  if (!email) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const u = new URL(req.url);
  const id = u.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const pool = getPool();
  await ensureSchema(pool);
  await pool.query("DELETE FROM user_integrations WHERE integration_id=$1 AND user_email=$2", [
    id,
    email,
  ]);
  return NextResponse.json({ ok: true });
}
