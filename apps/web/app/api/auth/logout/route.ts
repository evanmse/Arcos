import { NextRequest, NextResponse } from "next/server";

export async function POST(_req: NextRequest) {
  const res = new NextResponse(null, {
    status: 303,
    headers: { Location: "/login" },
  });
  res.cookies.set("integreat_session", "", { path: "/", maxAge: 0 });
  return res;
}
