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
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "1");
    if (next) url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  }
  const url = req.nextUrl.clone();
  url.pathname = next.startsWith("/") ? next : "/dashboard";
  url.search = "";
  const res = NextResponse.redirect(url);
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
