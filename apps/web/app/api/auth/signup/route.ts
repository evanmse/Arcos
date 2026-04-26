import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getPool } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import { hashPassword } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const displayName = String(form.get("name") || email.split("@")[0]);
  const next = String(form.get("next") || "/dashboard");

  if (!email.includes("@") || password.length < 4) {
    return redirectError("Invalid email or password (min 4 chars).");
  }

  try {
    const pool = getPool();
    await ensureSchema(pool);
    const exists = await pool.query("SELECT 1 FROM users WHERE email=$1", [email]);
    if ((exists.rowCount ?? 0) > 0) {
      return redirectError("An account already exists for this email.");
    }
    const id = "usr-" + crypto.randomBytes(6).toString("hex");
    await pool.query(
      `INSERT INTO users (user_id, email, display_name, password_hash)
       VALUES ($1, $2, $3, $4)`,
      [id, email, displayName, hashPassword(password)],
    );
  } catch (e: any) {
    return redirectError("Could not create account: " + (e.message || e));
  }

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

function redirectError(msg: string) {
  const params = new URLSearchParams({ error: msg });
  return new NextResponse(null, {
    status: 303,
    headers: { Location: `/signup?${params.toString()}` },
  });
}
