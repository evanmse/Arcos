import { NextResponse } from "next/server";
import { loadPolicies } from "@/lib/data";
import { applyOverrides } from "@/lib/policy-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const policies = await loadPolicies();
  return NextResponse.json({ policies: applyOverrides(policies) });
}
