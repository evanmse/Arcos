"use client";
import { useEffect, useState } from "react";

type Agent = {
  agent_id: string;
  name: string;
  repo_url: string;
  path: string | null;
  description: string | null;
  status: string;
  trust_score?: number | null;
  grade?: string | null;
  risk_class?: string | null;
  insurance_eligible?: boolean | null;
  analyzed_at?: string | null;
  model?: string | null;
};

const SAMPLES = [
  {
    name: "Atlas Underwriter",
    repo_url: "https://github.com/evanmse/integreat",
    path: "samples/agents/atlas-underwriter",
    description: "Insurance underwriter agent — auto-prices SMB policy quotes from claims history.",
  },
  {
    name: "Iris Recruiter",
    repo_url: "https://github.com/evanmse/integreat",
    path: "samples/agents/iris-recruiter",
    description: "HR screening agent — ranks resumes, drafts interview questions.",
  },
  {
    name: "Nova Support",
    repo_url: "https://github.com/evanmse/integreat",
    path: "samples/agents/nova-support",
    description: "Customer support agent — answers tier-1 tickets from a KB.",
  },
];

export default function AgentsClient() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportFor, setReportFor] = useState<{ agent: Agent; data: any } | null>(null);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [reanalyzeFor, setReanalyzeFor] = useState<Agent | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/agents", { cache: "no-store" }).then((r) => r.json());
      setAgents(r.agents || []);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    refresh();
  }, []);

  const register = async (input: {
    name: string;
    repo_url: string;
    path?: string;
    description?: string;
  }) => {
    await fetch("/api/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    refresh();
  };

  const analyze = async (a: Agent, policy_ids?: string[]) => {
    setAnalyzing(a.agent_id);
    try {
      const r = await fetch(`/api/agents/${a.agent_id}/analyze`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(policy_ids ? { policy_ids } : {}),
      });
      const data = await r.json();
      if (!r.ok) {
        alert("Analysis failed: " + (data.error || data.details || "unknown"));
      } else {
        setReportFor({ agent: a, data });
      }
      refresh();
    } finally {
      setAnalyzing(null);
    }
  };

  return (
    <>
      <RegisterPanel onRegister={register} />

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-semibold">Connected agents</h2>
          <span className="text-[11.5px] text-white/45">{agents.length} registered</span>
        </div>

        {loading ? (
          <div className="card p-5 text-[12.5px] text-white/55">Loading agents…</div>
        ) : agents.length === 0 ? (
          <div className="card p-5 text-[12.5px] text-white/55">
            No agent yet. Try one of the sample repos above to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {agents.map((a) => (
              <AgentCard
                key={a.agent_id}
                a={a}
                onAnalyze={() => analyze(a)}
                onReanalyzeWith={() => setReanalyzeFor(a)}
                analyzing={analyzing === a.agent_id}
              />
            ))}
          </div>
        )}
      </section>

      {reportFor && (
        <ReportModal
          agent={reportFor.agent}
          data={reportFor.data}
          onClose={() => setReportFor(null)}
        />
      )}
      {reanalyzeFor && (
        <PolicySelectorModal
          agent={reanalyzeFor}
          onClose={() => setReanalyzeFor(null)}
          onRun={(ids) => {
            const target = reanalyzeFor;
            setReanalyzeFor(null);
            if (target) analyze(target, ids);
          }}
        />
      )}
    </>
  );
}

function RegisterPanel({
  onRegister,
}: {
  onRegister: (i: { name: string; repo_url: string; path?: string; description?: string }) => void;
}) {
  const [mode, setMode] = useState<"quick" | "github">("quick");
  const [name, setName] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [path, setPath] = useState("");
  const [description, setDescription] = useState("");
  const [voltaBusy, setVoltaBusy] = useState(false);
  const [voltaMsg, setVoltaMsg] = useState<string | null>(null);

  const seedVolta = async () => {
    setVoltaBusy(true);
    setVoltaMsg(null);
    try {
      const r = await fetch("/api/demo/volta", { method: "POST" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "failed");
      setVoltaMsg(`✓ ${d.seeded} Volta Bank agents loaded — refresh the page.`);
      setTimeout(() => window.location.reload(), 800);
    } catch (e: any) {
      setVoltaMsg(`Failed: ${e.message ?? e}`);
    } finally {
      setVoltaBusy(false);
    }
  };

  return (
    <section className="card-elevated p-5">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <span className="pill">register</span>
          <h2 className="text-[16px] font-semibold mt-1.5">Add an agent</h2>
          <p className="text-[12px] mt-0.5" style={{ color: "var(--ink-500)" }}>
            Pick a sample, paste a GitHub URL, or load the full Volta Bank demo fleet.
          </p>
        </div>
        <button
          className="btn-ghost !py-1.5 !px-3 text-[12px]"
          onClick={seedVolta}
          disabled={voltaBusy}
          title="Seeds 5 high-risk Volta Bank agents with realistic findings"
        >
          {voltaBusy ? "Loading…" : "Load Volta Bank fleet"}
        </button>
      </div>

      {voltaMsg && (
        <div className="text-[11.5px] mb-3" style={{ color: "var(--ink-600)" }}>
          {voltaMsg}
        </div>
      )}

      <div className="flex items-center gap-1.5 mb-3">
        <button
          className={`chip ${mode === "quick" ? "chip-orange" : ""}`}
          onClick={() => setMode("quick")}
        >
          Quick samples
        </button>
        <button
          className={`chip ${mode === "github" ? "chip-orange" : ""}`}
          onClick={() => setMode("github")}
        >
          From GitHub
        </button>
      </div>

      {mode === "quick" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {SAMPLES.map((s) => (
            <button
              key={s.name}
              onClick={() => onRegister(s)}
              className="card p-3.5 text-left hover:shadow-md transition-shadow"
              style={{ borderColor: "var(--bone-300)" }}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-[13px]" style={{ color: "var(--ink-900)" }}>
                  {s.name}
                </span>
                <span className="t-mono text-[10px]" style={{ color: "var(--ink-400)" }}>
                  add →
                </span>
              </div>
              <div className="text-[11.5px] mt-1.5" style={{ color: "var(--ink-500)" }}>
                {s.description}
              </div>
            </button>
          ))}
        </div>
      )}

      {mode === "github" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            className="input"
            placeholder="Agent name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="input"
            placeholder="https://github.com/owner/repo"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
          />
          <input
            className="input"
            placeholder="Path inside repo (optional)"
            value={path}
            onChange={(e) => setPath(e.target.value)}
          />
          <input
            className="input"
            placeholder="Short description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="md:col-span-2 flex justify-end">
            <button
              className="btn-primary !py-2 !px-3.5 text-[12.5px]"
              disabled={!name || !repoUrl}
              onClick={() => {
                onRegister({ name, repo_url: repoUrl, path, description });
                setName("");
                setRepoUrl("");
                setPath("");
                setDescription("");
              }}
            >
              Register agent
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function AgentCard({
  a,
  onAnalyze,
  onReanalyzeWith,
  analyzing,
}: {
  a: Agent;
  onAnalyze: () => void;
  onReanalyzeWith: () => void;
  analyzing: boolean;
}) {
  const score = a.trust_score ?? null;
  const grade = a.grade ?? null;
  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[14.5px] font-semibold truncate">{a.name}</div>
          <a
            href={a.repo_url}
            target="_blank"
            rel="noreferrer"
            className="text-[11.5px] text-white/45 font-mono break-all hover:text-white/80"
          >
            {a.repo_url}
            {a.path ? "/" + a.path : ""}
          </a>
        </div>
        {grade && <GradeBadge grade={grade} />}
      </div>
      {a.description && (
        <div className="text-[12px] text-white/55 line-clamp-2">{a.description}</div>
      )}
      <div className="grid grid-cols-3 gap-2">
        <Mini num={score != null ? `${score}` : "—"} label="trust" />
        <Mini num={a.risk_class ?? "—"} label="risk class" />
        <Mini
          num={a.insurance_eligible ? "Yes" : a.analyzed_at ? "No" : "—"}
          label="insurable"
        />
      </div>
      <div className="flex gap-2">
        <button
          className="btn-primary !py-1.5 !px-3 text-[12px] flex-1"
          onClick={onAnalyze}
          disabled={analyzing}
        >
          {analyzing ? "Analyzing… (Gemini 2.5-Pro)" : score != null ? "Re-analyze" : "Analyze"}
        </button>
        <button
          className="btn-ghost !py-1.5 !px-3 text-[12px]"
          onClick={onReanalyzeWith}
          disabled={analyzing}
          title="Re-analyze with selected policies"
        >
          ⚙ Policies
        </button>
        <a
          className="btn-ghost !py-1.5 !px-3 text-[12px]"
          href={`/reports?agent=${a.agent_id}`}
          title="View full analysis history"
        >
          🕒 History
        </a>
      </div>
      <AgentHistoryStrip agentId={a.agent_id} />
    </div>
  );
}

function AgentHistoryStrip({ agentId }: { agentId: string }) {
  const [items, setItems] = useState<any[] | null>(null);
  useEffect(() => {
    fetch(`/api/agents/${agentId}/analyses`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setItems((d.analyses || []).slice(0, 4)))
      .catch(() => setItems([]));
  }, [agentId]);
  if (items === null) return null;
  if (items.length === 0) return null;
  return (
    <div
      className="mt-1 pt-3 border-t flex items-center gap-2 overflow-x-auto"
      style={{ borderColor: "var(--bone-300)" }}
    >
      <span className="t-eyebrow shrink-0">last runs</span>
      {items.map((it: any) => (
        <a
          key={it.analysis_id}
          href={`/reports?agent=${agentId}&open=${it.analysis_id}`}
          className="shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] transition-colors"
          style={{ background: "var(--bone-100)", border: "1px solid var(--bone-300)", color: "var(--ink-700)" }}
          title={new Date(it.created_at).toLocaleString()}
        >
          <span className="t-mono tabular">{it.trust_score ?? "—"}</span>
          <span style={{ color: "var(--ink-400)" }}>·</span>
          <span className="t-mono">{it.grade}</span>
          <span style={{ color: "var(--ink-400)" }}>·</span>
          <span className="t-mono text-[10px]" style={{ color: "var(--ink-400)" }}>
            {timeAgo(it.created_at)}
          </span>
        </a>
      ))}
    </div>
  );
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

function GradeBadge({ grade }: { grade: string }) {
  const map: Record<string, string> = {
    A: "chip-emerald",
    B: "chip-sky",
    C: "chip-violet",
    D: "chip-amber",
    E: "chip-pink",
  };
  return <span className={`chip ${map[grade] ?? ""}`}>grade {grade}</span>;
}

function Mini({ num, label }: { num: string; label: string }) {
  return (
    <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-2 text-center">
      <div className="text-[16px] font-semibold tabular truncate">{num}</div>
      <div className="text-[10px] uppercase tracking-wider text-white/45 mt-0.5">{label}</div>
    </div>
  );
}

function ReportModal({
  agent,
  data,
  onClose,
}: {
  agent: Agent;
  data: any;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4">
      <div className="card-elevated p-6 w-full max-w-3xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="pill">certified</div>
            <h3 className="text-[18px] font-semibold mt-2">{agent.name} — analysis report</h3>
            <p className="text-[12px] text-white/45 mt-1">
              Powered by Gemini 2.5-Pro · grounded on EU AI Act, GDPR, DORA, MiCA · {data.analysis_id}
            </p>
          </div>
          <button onClick={onClose} className="text-white/45 hover:text-white text-2xl">
            ×
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2 mb-4">
          <Mini num={`${data.trust_score}`} label="trust score" />
          <Mini num={data.grade} label="grade" />
          <Mini num={data.risk_class} label="risk class" />
          <Mini num={data.insurance_eligible ? "Yes" : "No"} label="insurable" />
        </div>
        {data.premium_estimate_eur_per_year > 0 && (
          <div className="mb-4 text-[12.5px] text-white/65">
            Estimated premium:{" "}
            <span className="font-semibold text-white">
              €{Number(data.premium_estimate_eur_per_year).toLocaleString()} / year
            </span>
          </div>
        )}
        {Array.isArray(data.findings) && data.findings.length > 0 && (
          <section className="mb-4">
            <h4 className="text-[13px] font-semibold mb-2">Findings</h4>
            <ul className="flex flex-col gap-2">
              {data.findings.map((f: any, i: number) => (
                <li key={i} className="card p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`chip ${
                        f.severity === "high"
                          ? "chip-pink"
                          : f.severity === "medium"
                          ? "chip-amber"
                          : "chip-emerald"
                      }`}
                    >
                      {f.severity}
                    </span>
                    <span className="text-[13px] font-semibold">{f.title}</span>
                  </div>
                  <div className="text-[12px] text-white/65">{f.evidence}</div>
                  <div className="text-[12px] text-white/45 mt-1">→ {f.recommendation}</div>
                </li>
              ))}
            </ul>
          </section>
        )}
        {data.risk_matrix && Object.keys(data.risk_matrix).length > 0 && (
          <section className="mb-4">
            <h4 className="text-[13px] font-semibold mb-2">Risk matrix</h4>
            <RiskMatrix matrix={data.risk_matrix} />
          </section>
        )}
        {data.report_md && (
          <section>
            <h4 className="text-[13px] font-semibold mb-2">Executive report</h4>
            <pre className="whitespace-pre-wrap text-[12.5px] text-white/75 font-sans leading-relaxed">
              {data.report_md}
            </pre>
          </section>
        )}
      </div>
    </div>
  );
}

function RiskMatrix({
  matrix,
}: {
  matrix: Record<string, { likelihood: number; impact: number }>;
}) {
  const cells = Object.entries(matrix).filter(
    ([, v]) => v && typeof v.likelihood === "number" && typeof v.impact === "number",
  );
  // colour by likelihood*impact
  const tone = (l: number, i: number) => {
    const s = l * i;
    if (s >= 16) return "bg-rose-500/40 border-rose-400/50";
    if (s >= 9) return "bg-amber-400/30 border-amber-300/50";
    if (s >= 4) return "bg-emerald-400/25 border-emerald-300/40";
    return "bg-emerald-500/15 border-emerald-400/30";
  };
  return (
    <div className="card p-3">
      {/* legend */}
      <div className="flex items-center gap-3 text-[10.5px] text-white/55 mb-2">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/15 border border-emerald-400/30" />
          low
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400/25 border border-emerald-300/40" />
          moderate
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-400/30 border border-amber-300/50" />
          elevated
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-rose-500/40 border border-rose-400/50" />
          critical
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {cells.map(([k, v]) => (
          <div
            key={k}
            className={`rounded-lg border ${tone(v.likelihood, v.impact)} px-3 py-2 flex items-center justify-between`}
          >
            <div className="text-[12px] font-medium capitalize">
              {k.replaceAll("_", " ")}
            </div>
            <div className="text-[10.5px] text-white/70 font-mono">
              L{v.likelihood} · I{v.impact} · {v.likelihood * v.impact}/25
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PolicySelectorModal({
  agent,
  onClose,
  onRun,
}: {
  agent: Agent;
  onClose: () => void;
  onRun: (ids: string[]) => void;
}) {
  const [policies, setPolicies] = useState<
    { policy_id: string; label: string; mandatory: boolean; weight?: number; description?: string | null }[]
  >([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tenant-policies", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const list = d.policies || [];
        setPolicies(list);
        setSelected(list.map((p: any) => p.policy_id));
      })
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id: string) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4">
      <div className="card-elevated p-5 w-full max-w-xl max-h-[85vh] overflow-auto">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="pill">re-analyze</span>
            <h3 className="text-[16px] font-semibold mt-2">{agent.name}</h3>
            <p className="text-[12px] text-white/55 mt-1">
              Select the policies that should drive this run.
            </p>
          </div>
          <button onClick={onClose} className="text-white/45 hover:text-white text-2xl">
            ×
          </button>
        </div>
        {loading ? (
          <div className="text-[12.5px] text-white/55">Loading policies…</div>
        ) : policies.length === 0 ? (
          <div className="text-[12.5px] text-white/55">
            No policy yet — adopt some templates first in Policies.
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 mb-4">
            {policies.map((p) => (
              <label
                key={p.policy_id}
                className="card !p-2.5 flex items-start gap-2 cursor-pointer hover:border-white/15"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(p.policy_id)}
                  onChange={() => toggle(p.policy_id)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[12.5px] font-medium">{p.label}</span>
                    {p.mandatory && <span className="chip chip-pink">mandatory</span>}
                    <span className="chip">w{p.weight ?? 5}</span>
                  </div>
                  {p.description && (
                    <div className="text-[11.5px] text-white/55 line-clamp-2 mt-0.5">
                      {p.description}
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
        )}
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn-ghost !py-1.5 !px-3 text-[12.5px]">
            Cancel
          </button>
          <button
            disabled={selected.length === 0}
            onClick={() => onRun(selected)}
            className="btn-primary !py-1.5 !px-3 text-[12.5px]"
          >
            Run analysis ({selected.length})
          </button>
        </div>
      </div>
    </div>
  );
}
