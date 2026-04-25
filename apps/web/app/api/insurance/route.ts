import { NextResponse } from "next/server";
import { INSURANCE_PARTNERS, loadInsuranceCatalog } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (id) {
    if (!INSURANCE_PARTNERS.some((p) => p.id === id)) {
      return NextResponse.json({ error: "unknown_catalog" }, { status: 404 });
    }
    const clauses = await loadInsuranceCatalog(id);
    return NextResponse.json({ catalog_id: id, clauses });
  }
  return NextResponse.json({ partners: INSURANCE_PARTNERS });
}
