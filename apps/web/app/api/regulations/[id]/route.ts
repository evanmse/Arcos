import { NextResponse } from "next/server";
import { getRegulation, listArticles, listObligations } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const [regulation, articles, obligations] = await Promise.all([
      getRegulation(id),
      listArticles(id),
      listObligations(id),
    ]);
    if (!regulation) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json({ regulation, articles, obligations });
  } catch (err) {
    return NextResponse.json(
      { error: "DB unavailable", message: (err as Error).message },
      { status: 503 },
    );
  }
}
