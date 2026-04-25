import { promises as fs } from "node:fs";
import path from "node:path";
import type { InsuranceClause, Policy, StandardSection } from "./types";

const REPO_ROOT = path.resolve(process.cwd(), "..", "..");

export async function loadPolicies(): Promise<Policy[]> {
  const file = path.join(
    REPO_ROOT,
    "packages",
    "policies",
    "policies_seed.json",
  );
  const raw = await fs.readFile(file, "utf-8");
  return JSON.parse(raw) as Policy[];
}

export async function loadStandard(
  standardId: string,
): Promise<StandardSection[]> {
  const file = path.join(
    REPO_ROOT,
    "apps",
    "pipeline-risk",
    "data",
    "standards",
    `${standardId}.json`,
  );
  const raw = await fs.readFile(file, "utf-8");
  return JSON.parse(raw) as StandardSection[];
}

export async function loadInsuranceCatalog(
  catalogId: string,
): Promise<InsuranceClause[]> {
  const file = path.join(
    REPO_ROOT,
    "apps",
    "pipeline-risk",
    "data",
    "insurance",
    `${catalogId}_terms.json`,
  );
  const raw = await fs.readFile(file, "utf-8");
  return JSON.parse(raw) as InsuranceClause[];
}

export const STANDARDS = [
  { id: "iso_42001", title: "ISO/IEC 42001 — AI management system" },
  { id: "iso_23894", title: "ISO/IEC 23894 — AI risk management" },
  { id: "nist_ai_rmf", title: "NIST AI Risk Management Framework" },
  { id: "owasp_llm_top10", title: "OWASP Top 10 for LLM Applications" },
] as const;

export const INSURANCE_PARTNERS = [
  { id: "munichre", name: "Munich Re" },
  { id: "hiscox", name: "Hiscox" },
  { id: "axaxl", name: "AXA XL" },
] as const;
