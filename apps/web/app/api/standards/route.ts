import { NextResponse } from "next/server";
import { STANDARDS, loadStandard } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (id) {
    if (!STANDARDS.some((s) => s.id === id)) {
      return NextResponse.json({ error: "unknown_standard" }, { status: 404 });
    }
    const sections = await loadStandard(id);
    return NextResponse.json({ standard_id: id, sections });
  }
  return NextResponse.json({ standards: STANDARDS });
}
