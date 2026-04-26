import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = [
  "/dashboard",
  "/data",
  "/policies",
  "/regulations",
  "/agents",
  "/reports",
  "/insurance",
  "/settings",
];

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/data/:path*",
    "/policies/:path*",
    "/regulations/:path*",
    "/agents/:path*",
    "/reports/:path*",
    "/insurance/:path*",
    "/settings/:path*",
  ],
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Allow when auth disabled (no AUTH_PASSWORD set OR explicit AUTH_DISABLED=1)
  if (process.env.AUTH_DISABLED === "1") return NextResponse.next();
  const requiresAuth = PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (!requiresAuth) return NextResponse.next();
  const session = req.cookies.get("integreat_session")?.value;
  if (session && session.length > 0) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}
