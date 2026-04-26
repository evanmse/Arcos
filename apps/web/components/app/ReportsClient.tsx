"use client";
import { useEffect, useMemo, useState } from "react";

type AnalysisRow = {
  analysis_id: string;
  agent_id: string;
  agent_name: string;
  repo_url?: string;
  model: string;
  trust_score: number;
  grade: string;
  risk_class: string;
  insurance_eligible: boolean;
  premium_estimate: number;
  created_at: string;
};

type AnalysisFull = AnalysisRow & {
  findings: any[];
  matched_obligations: any[];
  matched_policies: any[];
  report_md: string;
  risk_matrix: Record<string, { likelihood: number; impact: number }>;
};

const GRADE_TONE: Record<string, string> = {
  A: "chip-emerald",
  B: "chip-sky",
  C: "chip-violet",
  D: "chip-amber",
  E: "chip-pink",
};

const RISK_TONE: Record<string, string> = {
  minimal: "chip-emerald",
  limited: "chip-sky",
  high: "chip-amber",
  unacceptable: "chip-pink",
};

export default function ReportsClient() {
  const [rows, setRows] = useState<AnalysisRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [open, setOpen] = useState<AnalysisFull | null>(null);

  useEffect(() => {
    fetch("/api/analyses", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setRows(d.analyses || []))
      .finally(() => setLoading(false));
  }, []);

  // URL bootstrapping: ?agent=<id>&open=<analysis_id>
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const a = sp.get("agent");
    if (a) setAgentFilter(a);
    const o = sp.get("open");
    if (o) {
      fetch(`/api/analyses/${o}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => d?.analysis && setOpen(d.analysis));
    }
  }, []);

  const agents = useMemo(() => {
    const m = new Map<string, string>();
    rows.forEach((r) => m.set(r.agent_id, r.agent_name));
    return Array.from(m.entries());
  }, [rows]);

  const filtered = useMemo(
    () => (agentFilter === "all" ? rows : rows.filter((r) => r.agent_id === agentFilter)),
    [rows, agentFilter],
  );

  const stats = useMemo(() => {
    const n = filtered.length;
    if (!n) return null;
    const avg = filtered.reduce((s, r) => s + (Number(r.trust_score) || 0), 0) / n;
    const insurable = filtered.filter((r) => r.insurance_eligible).length;
    const high = filtered.filter((r) => r.risk_class === "high" || r.risk_class === "unacceptable").length;
    return { n, avg: Math.round(avg), insurable, high };
  }, [filtered]);

  const openReport = async (id: string) => {
    const d = await fetch(`/api/analyses/${id}`, { cache: "no-store" }).then((r) => r.json());
    if (d?.analysis) setOpen(d.analysis);
  };

  return (
    <>
      {stats && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Reports" value={String(stats.n)} />
          <Stat label="Average score" value={`${stats.avg}/100`} />
          <Stat label="Insurable" value={`${stats.insurable}/${stats.n}`} />
          <Stat label="High-risk" value={String(stats.high)} accent={stats.high > 0 ? "pink" : "emerald"} />
        </section>
      )}

      <section className="card-elevated overflow-hidden">
        <div className="card-header flex-wrap gap-3">
          <div>
            <span className="pill">history</span>
            <h2 className="card-title mt-2 text-[15px]">All analyses</h2>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              className={`chip ${agentFilter === "all" ? "chip-violet" : ""}`}
              onClick={() => setAgentFilter("all")}
            >
              all · {rows.length}
            </button>
            {agents.map(([id, name]) => (
              <button
                key={id}
                className={`chip ${agentFilter === id ? "chip-violet" : ""}`}
                onClick={() => setAgentFilter(id)}
                title={id}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-[12.5px]" style={{ color: "var(--ink-500)" }}>
            Loading reports…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-[12.5px]" style={{ color: "var(--ink-500)" }}>
            No analysis yet. Run one from the Agents page.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead style={{ background: "var(--bone-100)", color: "var(--ink-500)" }}>
                <tr className="t-eyebrow">
                  <th className="text-left px-4 py-2.5">Agent</th>
                  <th className="text-left px-4 py-2.5">When</th>
                  <th className="text-left px-4 py-2.5">Score</th>
                  <th className="text-left px-4 py-2.5">Grade</th>
                  <th className="text-left px-4 py-2.5">Risk</th>
                  <th className="text-left px-4 py-2.5">Insurable</th>
                  <th className="text-left px-4 py-2.5">Est. premium</th>
                  <th className="text-right px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.analysis_id}
                    className="border-t cursor-pointer transition-colors"
                    style={{ borderColor: "var(--bone-300)" }}
                    onClick={() => openReport(r.analysis_id)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bone-100)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-4 py-2.5">
                      <div className="font-medium" style={{ color: "var(--ink-900)" }}>{r.agent_name}</div>
                      <div className="t-mono text-[10.5px]" style={{ color: "var(--ink-400)" }}>
                        {r.analysis_id}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 t-mono" style={{ color: "var(--ink-600)" }}>
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <ScoreBar value={r.trust_score} />
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`chip ${GRADE_TONE[r.grade] || ""}`}>{r.grade}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`chip ${RISK_TONE[r.risk_class] || ""}`}>{r.risk_class}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      {r.insurance_eligible ? (
                        <span className="chip chip-emerald">yes</span>
                      ) : (
                        <span className="chip chip-pink">no</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 t-mono tabular" style={{ color: "var(--ink-700)" }}>
                      {r.premium_estimate ? `€${Number(r.premium_estimate).toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button className="btn-ghost !py-1 !px-2 text-[11.5px]">Open →</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {open && <ReportDrawer analysis={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: "pink" | "emerald" }) {
  const color =
    accent === "pink" ? "oklch(40% 0.18 27)" :
    accent === "emerald" ? "oklch(40% 0.16 128)" :
    "var(--ink-900)";
  return (
    <div className="card p-4">
      <div className="t-eyebrow">{label}</div>
      <div className="mt-1 text-[26px] font-semibold tabular leading-none" style={{ color, letterSpacing: "-0.022em" }}>
        {value}
      </div>
    </div>
  );
}

function ScoreBar({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const color =
    v >= 80 ? "oklch(60% 0.16 145)" :
    v >= 60 ? "oklch(70% 0.18 75)" :
    "oklch(62% 0.20 27)";
  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <div className="progress-track flex-1">
        <div className="progress-fill" style={{ width: `${v}%`, background: color }} />
      </div>
      <span className="t-mono tabular text-[11.5px]" style={{ color: "var(--ink-700)" }}>
        {v}
      </span>
    </div>
  );
}

function ReportDrawer({ analysis, onClose }: { analysis: AnalysisFull; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(11,13,16,0.4)" }} onClick={onClose}>
      <div
        className="w-full max-w-[760px] h-full overflow-y-auto"
        style={{ background: "var(--bone-50)", borderLeft: "1px solid var(--bone-300)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between border-b"
          style={{ borderColor: "var(--bone-300)", background: "rgba(250,248,244,0.92)", backdropFilter: "blur(8px)" }}
        >
          <div>
            <span className="pill">analysis · {analysis.model}</span>
            <h3 className="text-[18px] font-semibold mt-1.5">{analysis.agent_name}</h3>
            <div className="t-mono text-[11px]" style={{ color: "var(--ink-500)" }}>
              {analysis.analysis_id} · {new Date(analysis.created_at).toLocaleString()}
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost text-[20px]">×</button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          {/* KPI row */}
          <div className="grid grid-cols-4 gap-2.5">
            <Mini num={`${analysis.trust_score}`} label="trust score" />
            <Mini num={analysis.grade} label="grade" />
            <Mini num={analysis.risk_class} label="risk class" />
            <Mini num={analysis.insurance_eligible ? "Yes" : "No"} label="insurable" />
          </div>
          {analysis.premium_estimate > 0 && (
            <div className="card p-4">
              <div className="t-eyebrow">Insurance estimate</div>
              <div className="text-[22px] font-semibold tabular mt-1" style={{ letterSpacing: "-0.022em" }}>
                €{Number(analysis.premium_estimate).toLocaleString()} <span className="text-[12px] font-normal" style={{ color: "var(--ink-500)" }}>/ year</span>
              </div>
            </div>
          )}

          {/* Risk matrix */}
          {analysis.risk_matrix && Object.keys(analysis.risk_matrix).length > 0 && (
            <section>
              <h4 className="text-[13px] font-semibold mb-2">Risk matrix</h4>
              <RiskMatrix matrix={analysis.risk_matrix} />
            </section>
          )}

          {/* Findings */}
          {Array.isArray(analysis.findings) && analysis.findings.length > 0 && (
            <section>
              <h4 className="text-[13px] font-semibold mb-2">Findings · {analysis.findings.length}</h4>
              <ul className="flex flex-col gap-2">
                {analysis.findings.map((f: any, i: number) => (
                  <li key={i} className="card p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`chip ${
                          f.severity === "high" ? "chip-pink" : f.severity === "medium" ? "chip-amber" : "chip-emerald"
                        }`}
                      >
                        {f.severity}
                      </span>
                      <span className="text-[13px] font-semibold">{f.title}</span>
                    </div>
                    <div className="text-[12px]" style={{ color: "var(--ink-700)" }}>{f.evidence}</div>
                    <div className="text-[12px] mt-1" style={{ color: "var(--ink-500)" }}>→ {f.recommendation}</div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Obligations */}
          {Array.isArray(analysis.matched_obligations) && analysis.matched_obligations.length > 0 && (
            <section>
              <h4 className="text-[13px] font-semibold mb-2">
                Matched obligations · {analysis.matched_obligations.length}
              </h4>
              <div className="flex flex-col gap-1.5">
                {analysis.matched_obligations.map((o: any, i: number) => (
                  <div key={i} className="card p-3 text-[12px]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="chip chip-violet">{o.regulation_id}</span>
                      <span
                        className={`chip ${
                          o.verdict === "covered" ? "chip-emerald" : o.verdict === "partial" ? "chip-amber" : "chip-pink"
                        }`}
                      >
                        {o.verdict}
                      </span>
                      <span className="t-mono text-[10.5px]" style={{ color: "var(--ink-400)" }}>
                        {o.obligation_id}
                      </span>
                    </div>
                    <div style={{ color: "var(--ink-700)" }}>{o.rationale}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Policies */}
          {Array.isArray(analysis.matched_policies) && analysis.matched_policies.length > 0 && (
            <section>
              <h4 className="text-[13px] font-semibold mb-2">
                Tenant policies · {analysis.matched_policies.length}
              </h4>
              <div className="flex flex-col gap-1.5">
                {analysis.matched_policies.map((p: any, i: number) => (
                  <div key={i} className="card p-3 text-[12px] flex items-start gap-3">
                    <span
                      className={`chip ${
                        p.verdict === "covered" ? "chip-emerald" : p.verdict === "partial" ? "chip-amber" : "chip-pink"
                      }`}
                    >
                      {p.verdict}
                    </span>
                    <div className="flex-1">
                      <div className="t-mono text-[10.5px] mb-0.5" style={{ color: "var(--ink-400)" }}>
                        {p.policy_id}
                      </div>
                      {p.rationale && <div style={{ color: "var(--ink-700)" }}>{p.rationale}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Executive report */}
          {analysis.report_md && (
            <section>
              <h4 className="text-[13px] font-semibold mb-2">Executive report</h4>
              <pre
                className="card p-4 whitespace-pre-wrap font-sans text-[12.5px] leading-relaxed"
                style={{ color: "var(--ink-800)", margin: 0, background: "var(--bone-50)" }}
              >
                {analysis.report_md}
              </pre>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function Mini({ num, label }: { num: string; label: string }) {
  return (
    <div className="card p-3 text-center">
      <div className="text-[18px] font-semibold tabular truncate" style={{ letterSpacing: "-0.018em" }}>
        {num}
      </div>
      <div className="t-eyebrow mt-0.5">{label}</div>
    </div>
  );
}

function RiskMatrix({ matrix }: { matrix: Record<string, { likelihood: number; impact: number }> }) {
  const cells = Object.entries(matrix).filter(
    ([, v]) => v && typeof v.likelihood === "number" && typeof v.impact === "number",
  );
  const tone = (l: number, i: number) => {
    const s = l * i;
    if (s >= 16) return { bg: "var(--risk-high-bg)", border: "oklch(82% 0.10 27)" };
    if (s >= 9)  return { bg: "var(--risk-med-bg)",  border: "oklch(82% 0.08 75)" };
    if (s >= 4)  return { bg: "var(--risk-low-bg)",  border: "oklch(82% 0.08 145)" };
    return { bg: "var(--volt-soft)", border: "oklch(85% 0.10 128)" };
  };
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {cells.map(([k, v]) => {
        const t = tone(v.likelihood, v.impact);
        return (
          <div
            key={k}
            className="rounded-md px-3 py-2 flex items-center justify-between"
            style={{ background: t.bg, border: `1px solid ${t.border}` }}
          >
            <div className="text-[12px] font-medium capitalize" style={{ color: "var(--ink-800)" }}>
              {k.replaceAll("_", " ")}
            </div>
            <div className="t-mono tabular text-[10.5px]" style={{ color: "var(--ink-700)" }}>
              L{v.likelihood} · I{v.impact} · {v.likelihood * v.impact}/25
            </div>
          </div>
        );
      })}
    </div>
  );
}
