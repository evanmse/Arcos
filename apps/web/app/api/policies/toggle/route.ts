import { NextResponse } from "next/server";
import { z } from "zod";
import { loadPolicies } from "@/lib/data";
import { applyOverrides, setOverride } from "@/lib/policy-store";

const Body = z.object({
  policy_id: z.string().min(1),
  enabled: z.boolean(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const policies = await loadPolicies();
  const target = policies.find((p) => p.id === parsed.data.policy_id);
  if (!target) {
    return NextResponse.json({ error: "unknown_policy" }, { status: 404 });
  }
  if (target.mandatory && !parsed.data.enabled) {
    return NextResponse.json(
      {
        error: "mandatory_policy_disabled",
        message: `Policy ${target.id} est obligatoire et ne peut pas être désactivée.`,
      },
      { status: 409 },
    );
  }
  setOverride(parsed.data.policy_id, parsed.data.enabled);
  return NextResponse.json({
    ok: true,
    policies: applyOverrides(policies),
  });
}
