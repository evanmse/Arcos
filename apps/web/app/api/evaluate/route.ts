import { NextResponse } from "next/server";
import { z } from "zod";
import { INSURANCE_PARTNERS, loadInsuranceCatalog, loadPolicies } from "@/lib/data";
import { mockEvaluate } from "@/lib/evaluator";
import { applyOverrides } from "@/lib/policy-store";

const Body = z.object({
  github_url: z
    .string()
    .url()
    .regex(/^https:\/\/github\.com\//, "Doit être une URL github.com"),
  agent_name: z.string().min(2).max(120),
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
  const [policiesRaw, ...catalogs] = await Promise.all([
    loadPolicies(),
    ...INSURANCE_PARTNERS.map((p) => loadInsuranceCatalog(p.id)),
  ]);
  const policies = applyOverrides(policiesRaw);
  const insuranceCatalogs = Object.fromEntries(
    INSURANCE_PARTNERS.map((p, i) => [p.id, catalogs[i]]),
  );
  const result = mockEvaluate({
    githubUrl: parsed.data.github_url,
    agentName: parsed.data.agent_name,
    policies,
    insuranceCatalogs,
  });
  return NextResponse.json(result);
}
