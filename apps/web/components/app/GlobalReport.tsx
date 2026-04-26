"use client";
import { useEffect, useState } from "react";

type Heatmap = Record<string, Record<string, string>>;
type Agent = {
  agent_id: string;
  name: string;
  description?: string;
  trust_score: number | null;
  grade: string | null;
  risk_class: string | null;
  insurance_eligible: boolean | null;
  premium_estimate: number | null;
  finding_count: number;
  critical_findings: number;
};
type Priority = { agent: string; title: string; recommendation: string };
type Report = {
  generated_at: string;
  kpis: {
    tenant_trust_score: number | null;
    projected_trust_score: number | null;
    agents_total: number;
    agents_analyzed: number;
    critical_findings: number;
    total_findings: number;
    ai_act_t_minus_days: number;
  };
  regulations: string[];
  heatmap: Heatmap;
  agents: Agent[];
  priorities: Priority[];
};

const REG_LABEL: Record<string, string> = {
  ai_act: "AI Act",
  gdpr: "RGPD",
  dora: "DORA",
  mica: "MiCA",
  psd2: "PSD2",
  amld6: "AMLD6",
};

const VERDICT_BG: Record<string, string> = {
  missing: "var(--risk-high-bg, oklch(96% 0.05 25))",
  partial: "var(--risk-med-bg, oklch(96% 0.06 80))",
  compliant: "var(--risk-low-bg, oklch(96% 0.04 150))",
};
const VERDICT_FG: Record<string, string> = {
  missing: "oklch(45% 0.18 25)",
  partial: "oklch(45% 0.16 70)",
  compliant: "oklch(38% 0.16 150)",
};

export default function GlobalReport() {
  const [data, setData] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    const r = await fetch("/api/reports/global", { cache: "no-store" });
    const d = await r.json();
    setData(d);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const seedVolta = async () => {
    setSeeding(true);
    setSeedMsg(null);
    try {
      const r = await fetch("/api/demo/volta", { method: "POST" });
      if (!r.ok) throw new Error(await r.text());
      const d = await r.json();
      setSeedMsg(`Seeded ${d.seeded} agents (Volta Bank).`);
      await refresh();
    } catch (e: any) {
      setSeedMsg(`Failed: ${e.message ?? e}`);
    } finally {
      setSeeding(false);
      setTimeout(() => setSeedMsg(null), 4000);
    }
  };

  if (loading || !data) {
    return (
      <div className="card p-6 text-[12.5px]" style={{ color: "var(--ink-500)" }}>
        Compiling executive report…
      </div>
    );
  }

  const k = data.kpis;
  const noData = data.agents.length === 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Hero KPIs */}
      <section className="card-elevated p-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <span className="pill">executive · tenant-wide</span>
            <h2 className="text-[20px] font-semibold mt-2 tracking-tight">
              Compliance & risk posture
            </h2>
            <p className="text-[12.5px] mt-1.5" style={{ color: "var(--ink-500)" }}>
              Generated {new Date(data.generated_at).toLocaleString()} · Aggregates the latest
              analysis of every agent registered in this workspace.
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              className="btn-ghost !py-1.5 !px-3 text-[12px]"
              onClick={seedVolta}
              disabled={seeding}
            >
              {seeding ? "Seeding…" : "Load Volta Bank demo"}
            </button>
            <button className="btn-ghost !py-1.5 !px-3 text-[12px]" onClick={refresh}>
              Refresh
            </button>
          </div>
        </div>
        {seedMsg && (
          <div className="text-[11.5px] mt-2" style={{ color: "var(--ink-600)" }}>
            {seedMsg}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <Kpi
            label="Tenant trust score"
            value={k.tenant_trust_score != null ? `${k.tenant_trust_score}/100` : "—"}
            sub={
              k.projected_trust_score != null
                ? `→ ${k.projected_trust_score}/100 projected (after remediation)`
                : "Run an analysis to compute"
            }
          />
          <Kpi
            label="Critical findings"
            value={String(k.critical_findings)}
            sub={`${k.total_findings} total across the fleet`}
            tone={k.critical_findings > 0 ? "pink" : "emerald"}
          />
          <Kpi
            label="Agents analysed"
            value={`${k.agents_analyzed}/${k.agents_total}`}
            sub="Latest analysis used"
          />
          <Kpi
            label="AI Act enforcement"
            value={`T-${k.ai_act_t_minus_days}d`}
            sub="High-risk obligations · 2 Aug 2026"
          />
        </div>
      </section>

      {noData && (
        <section className="card p-5 text-[12.5px]" style={{ color: "var(--ink-600)" }}>
          No agents registered yet. Click <strong>Load Volta Bank demo</strong> above to populate a
          realistic fleet of 5 high-risk AI agents with findings, or register your own from the
          Agents page.
        </section>
      )}

      {/* Heatmap */}
      {!noData && (
        <section className="card-elevated p-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="pill">heatmap</span>
              <h3 className="text-[15px] font-semibold mt-1.5">Obligations × agents</h3>
            </div>
            <Legend />
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr style={{ color: "var(--ink-500)" }} className="t-eyebrow">
                  <th className="text-left px-3 py-2">Agent</th>
                  {data.regulations.map((r) => (
                    <th key={r} className="text-left px-3 py-2">
                      {REG_LABEL[r] ?? r}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.agents.map((a) => (
                  <tr
                    key={a.agent_id}
                    className="border-t"
                    style={{ borderColor: "var(--bone-300)" }}
                  >
                    <td className="px-3 py-2 font-medium" style={{ color: "var(--ink-900)" }}>
                      {a.name}
                    </td>
                    {data.regulations.map((r) => {
                      const v = data.heatmap[a.name]?.[r];
                      return (
                        <td key={r} className="px-2 py-1.5">
                          {v ? (
                            <span
                              className="chip"
                              style={{
                                background: VERDICT_BG[v] ?? "var(--bone-100)",
                                color: VERDICT_FG[v] ?? "var(--ink-700)",
                                border: "1px solid var(--bone-300)",
                              }}
                            >
                              {v}
                            </span>
                          ) : (
                            <span style={{ color: "var(--ink-400)" }}>—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Strategic risk summary */}
      {!noData && (
        <section className="card-elevated p-5">
          <span className="pill">fleet</span>
          <h3 className="text-[15px] font-semibold mt-1.5 mb-3">Strategic risk summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead style={{ background: "var(--bone-100)", color: "var(--ink-500)" }}>
                <tr className="t-eyebrow">
                  <th className="text-left px-3 py-2">Agent</th>
                  <th className="text-left px-3 py-2">Trust</th>
                  <th className="text-left px-3 py-2">Grade</th>
                  <th className="text-left px-3 py-2">Risk class</th>
                  <th className="text-left px-3 py-2">Findings</th>
                  <th className="text-left px-3 py-2">Insurable</th>
                  <th className="text-left px-3 py-2">Est. premium</th>
                </tr>
              </thead>
              <tbody>
                {data.agents.map((a) => (
                  <tr key={a.agent_id} className="border-t" style={{ borderColor: "var(--bone-300)" }}>
                    <td className="px-3 py-2 font-medium" style={{ color: "var(--ink-900)" }}>
                      {a.name}
                      {a.description && (
                        <div className="text-[11px] mt-0.5" style={{ color: "var(--ink-500)" }}>
                          {a.description.length > 100 ? a.description.slice(0, 100) + "…" : a.description}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 t-mono tabular">
                      {a.trust_score != null ? `${a.trust_score}/100` : "—"}
                    </td>
                    <td className="px-3 py-2">{a.grade ?? "—"}</td>
                    <td className="px-3 py-2">{a.risk_class ?? "—"}</td>
                    <td className="px-3 py-2 t-mono tabular">
                      <span style={{ color: "var(--ink-700)" }}>{a.finding_count}</span>
                      {a.critical_findings > 0 && (
                        <span style={{ color: "oklch(45% 0.2 25)" }}> · {a.critical_findings} crit</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {a.insurance_eligible ? (
                        <span className="chip chip-emerald">yes</span>
                      ) : (
                        <span className="chip chip-pink">no</span>
                      )}
                    </td>
                    <td className="px-3 py-2 t-mono tabular" style={{ color: "var(--ink-700)" }}>
                      {a.premium_estimate ? `€${Number(a.premium_estimate).toLocaleString()}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Priority remediation */}
      {!noData && data.priorities.length > 0 && (
        <section className="card-elevated p-5">
          <span className="pill">remediation · priority</span>
          <h3 className="text-[15px] font-semibold mt-1.5 mb-3">
            Top fixes ({data.priorities.length})
          </h3>
          <ol className="space-y-2.5">
            {data.priorities.slice(0, 12).map((p, i) => (
              <li
                key={i}
                className="flex gap-3 p-3 rounded-md"
                style={{ background: "var(--bone-100)", border: "1px solid var(--bone-300)" }}
              >
                <div
                  className="text-[12px] font-semibold tabular shrink-0"
                  style={{ color: "var(--ink-500)", width: 22 }}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px]" style={{ color: "var(--ink-900)" }}>
                    {p.title}
                  </div>
                  <div className="text-[11.5px] mt-0.5" style={{ color: "var(--ink-500)" }}>
                    <span className="t-mono">{p.agent}</span>
                    {p.recommendation && <> · {p.recommendation}</>}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "pink" | "emerald";
}) {
  const accent =
    tone === "pink" ? "oklch(45% 0.2 25)" : tone === "emerald" ? "oklch(38% 0.16 150)" : "var(--ink-900)";
  return (
    <div
      className="rounded-md p-3"
      style={{ background: "var(--bone-100)", border: "1px solid var(--bone-300)" }}
    >
      <div className="t-eyebrow" style={{ color: "var(--ink-500)" }}>
        {label}
      </div>
      <div
        className="text-[24px] font-semibold tabular leading-none mt-1.5"
        style={{ color: accent, letterSpacing: "-0.02em" }}
      >
        {value}
      </div>
      {sub && (
        <div className="text-[11px] mt-1.5" style={{ color: "var(--ink-500)" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-2 text-[11px]" style={{ color: "var(--ink-500)" }}>
      <span className="chip" style={{ background: VERDICT_BG.compliant, color: VERDICT_FG.compliant }}>
        compliant
      </span>
      <span className="chip" style={{ background: VERDICT_BG.partial, color: VERDICT_FG.partial }}>
        partial
      </span>
      <span className="chip" style={{ background: VERDICT_BG.missing, color: VERDICT_FG.missing }}>
        missing
      </span>
    </div>
  );
}
