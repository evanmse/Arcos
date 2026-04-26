import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import { hashPassword, verifyPassword } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const next = String(form.get("next") || "/dashboard");

  if (!email || !password) {
    return redirectError(next);
  }

  let ok = false;
  try {
    const pool = getPool();
    await ensureSchema(pool);
    const { rows } = await pool.query(
      "SELECT password_hash FROM users WHERE email=$1",
      [email],
    );
    if (rows[0]?.password_hash) {
      ok = verifyPassword(password, rows[0].password_hash);
    } else {
      // Auto-provision demo password as a real user (one-time)
      const required = process.env.AUTH_PASSWORD || "demo";
      if (password === required) {
        const id = "usr-" + Math.random().toString(16).slice(2, 14);
        await pool.query(
          `INSERT INTO users (user_id, email, display_name, password_hash)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (email) DO NOTHING`,
          [id, email, email.split("@")[0], hashPassword(password)],
        );
        ok = true;
      }
    }
  } catch {
    const required = process.env.AUTH_PASSWORD || "demo";
    ok = password === required;
  }

  if (!ok) return redirectError(next);

  const target = next.startsWith("/") ? next : "/dashboard";
  const res = new NextResponse(null, { status: 303, headers: { Location: target } });
  res.cookies.set("integreat_session", `${encodeURIComponent(email)}:${Date.now()}`, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

function redirectError(next: string) {
  const params = new URLSearchParams({ error: "1" });
  if (next) params.set("next", next);
  return new NextResponse(null, {
    status: 303,
    headers: { Location: `/login?${params.toString()}` },
  });
}
