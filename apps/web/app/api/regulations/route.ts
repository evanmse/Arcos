import { NextResponse } from "next/server";
import { listRegulations } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await listRegulations();
    return NextResponse.json({ regulations: rows });
  } catch (err) {
    return NextResponse.json(
      { error: "DB unavailable", message: (err as Error).message },
      { status: 503 },
    );
  }
}
