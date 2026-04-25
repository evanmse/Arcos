"use client";

import { useMemo, useState } from "react";
import type { Policy } from "@/lib/types";

type Group = { rootId: string | null; rootLabel: string; items: Policy[] };

export function PoliciesTree({ initial }: { initial: Policy[] }) {
  const [policies, setPolicies] = useState<Policy[]>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const groups = useMemo<Group[]>(() => {
    const byParent = new Map<string | null, Policy[]>();
    for (const p of policies) {
      const k = p.parent_id ?? null;
      const arr = byParent.get(k) ?? [];
      arr.push(p);
      byParent.set(k, arr);
    }
    const roots = byParent.get(null) ?? [];
    return roots.map((root) => {
      const children = collectDescendants(root.id, byParent);
      return { rootId: root.id, rootLabel: root.label, items: [root, ...children] };
    });
  }, [policies]);

  const enabledCount = policies.filter((p) => p.enabled).length;

  async function toggle(policy: Policy) {
    setBusy(policy.id);
    setError(null);
    try {
      const res = await fetch("/api/policies/toggle", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          policy_id: policy.id,
          enabled: !policy.enabled,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? data.error ?? "Erreur");
        return;
      }
      setPolicies(data.policies);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-white/60">
          {enabledCount} / {policies.length} policies activées
        </div>
        {error && (
          <div className="text-sm text-red-400">{error}</div>
        )}
      </div>
      <div className="grid gap-4">
        {groups.map((g) => (
          <div
            key={g.rootId ?? "root"}
            className="rounded-lg border border-white/10 bg-white/5"
          >
            <div className="px-4 py-3 border-b border-white/10 font-semibold">
              {g.rootLabel}
            </div>
            <ul className="divide-y divide-white/5">
              {g.items.map((p) => (
                <li
                  key={p.id}
                  className="px-4 py-3 flex items-center gap-3 text-sm"
                >
                  <button
                    onClick={() => toggle(p)}
                    disabled={busy === p.id}
                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${
                      p.enabled ? "bg-accent" : "bg-white/20"
                    } ${busy === p.id ? "opacity-50" : ""}`}
                    aria-label={`Toggle ${p.id}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        p.enabled ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-white/40">
                        {p.id}
                      </span>
                      {p.mandatory && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] uppercase bg-red-500/20 text-red-300">
                          mandatory
                        </span>
                      )}
                    </div>
                    <div className="text-white/80">{p.label}</div>
                    {p.risk_categories.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {p.risk_categories.map((rc) => (
                          <span
                            key={rc}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/60"
                          >
                            {rc}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function collectDescendants(
  rootId: string,
  byParent: Map<string | null, Policy[]>,
): Policy[] {
  const out: Policy[] = [];
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop()!;
    const kids = byParent.get(id) ?? [];
    for (const k of kids) {
      out.push(k);
      stack.push(k.id);
    }
  }
  return out;
}
