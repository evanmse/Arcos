import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const next = String(form.get("next") || "/dashboard");

  // Auth strategy: any email allowed if AUTH_PASSWORD env matches, OR
  // demo mode (AUTH_PASSWORD unset → password "demo" works) for hackathon.
  const required = process.env.AUTH_PASSWORD || "demo";
  if (!email || password !== required) {
    const params = new URLSearchParams({ error: "1" });
    if (next) params.set("next", next);
    return new NextResponse(null, {
      status: 303,
      headers: { Location: `/login?${params.toString()}` },
    });
  }
  // Use a relative path for the redirect. On Cloud Run, req.nextUrl can be
  // the internal upstream URL (localhost:8080), which would break the redirect
  // for browsers. A relative Location header is resolved by the browser
  // against the origin it actually contacted.
  const target = next.startsWith("/") ? next : "/dashboard";
  const res = new NextResponse(null, {
    status: 303,
    headers: { Location: target },
  });
  // Cookie value: "<email>:<issuedAt>" — opaque, not signed (demo grade).
  res.cookies.set("integreat_session", `${encodeURIComponent(email)}:${Date.now()}`, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
