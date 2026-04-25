import { loadPolicies } from "@/lib/data";
import { applyOverrides } from "@/lib/policy-store";
import { PoliciesTree } from "@/components/PoliciesTree";

export const dynamic = "force-dynamic";

export default async function PoliciesPage() {
  const policies = applyOverrides(await loadPolicies());
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Policies Tree</h1>
        <p className="text-white/60 text-sm mt-1">
          Toggle ON/OFF chaque policy. Les <span className="text-red-300">mandatory</span>{" "}
          ne peuvent pas être désactivées (validation côté API).
        </p>
      </div>
      <PoliciesTree initial={policies} />
    </div>
  );
}
