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

  const analyze = async (a: Agent) => {
    setAnalyzing(a.agent_id);
    try {
      const r = await fetch(`/api/agents/${a.agent_id}/analyze`, { method: "POST" });
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
    </>
  );
}

function RegisterPanel({
  onRegister,
}: {
  onRegister: (i: { name: string; repo_url: string; path?: string; description?: string }) => void;
}) {
  const [name, setName] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [path, setPath] = useState("");
  const [description, setDescription] = useState("");

  return (
    <section className="card-elevated p-5">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <span className="pill">connect</span>
          <h2 className="text-[16px] font-semibold mt-2">Register an agent from GitHub</h2>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {SAMPLES.map((s) => (
            <button
              key={s.name}
              className="chip chip-sky"
              onClick={() => {
                onRegister(s);
              }}
              title={s.description}
            >
              + {s.name}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          className="input"
          placeholder="Agent name (e.g. Atlas Underwriter)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="input"
          placeholder="GitHub repo URL (https://github.com/owner/repo)"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
        />
        <input
          className="input"
          placeholder="Path inside repo (optional, e.g. samples/agents/atlas-underwriter)"
          value={path}
          onChange={(e) => setPath(e.target.value)}
        />
        <input
          className="input"
          placeholder="One-line description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="flex justify-end mt-3">
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
    </section>
  );
}

function AgentCard({
  a,
  onAnalyze,
  analyzing,
}: {
  a: Agent;
  onAnalyze: () => void;
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
      </div>
    </div>
  );
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
