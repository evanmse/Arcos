import type { Policy } from "./types";

/**
 * In-memory toggle store. Survives across server requests in dev (single Node
 * process). Replaced by Postgres + Redis in Phase 5.
 */
const overrides = new Map<string, boolean>();

export function applyOverrides(policies: Policy[]): Policy[] {
  return policies.map((p) =>
    overrides.has(p.id) ? { ...p, enabled: overrides.get(p.id)! } : p,
  );
}

export function setOverride(policyId: string, enabled: boolean): void {
  overrides.set(policyId, enabled);
}

export function clearOverrides(): void {
  overrides.clear();
}
