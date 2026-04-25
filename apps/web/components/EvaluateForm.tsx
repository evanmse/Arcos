"use client";

import { useState } from "react";
import type { EvaluationResult } from "@/lib/types";

const SAMPLE = [
  {
    name: "fraud-detector-v3",
    url: "https://github.com/acme-fintech/fraud-detector",
  },
  {
    name: "credit-scoring-llm",
    url: "https://github.com/acme-fintech/credit-scoring-llm",
  },
  {
    name: "kyc-onboarding-agent",
    url: "https://github.com/acme-fintech/kyc-agent",
  },
];

export function EvaluateForm() {
  const [agentName, setAgentName] = useState(SAMPLE[0].name);
  const [githubUrl, setGithubUrl] = useState(SAMPLE[0].url);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EvaluationResult | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ github_url: githubUrl, agent_name: agentName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(JSON.stringify(data, null, 2));
        return;
      }
      setResult(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={submit}
        className="rounded-lg border border-white/10 bg-white/5 p-5 space-y-4"
      >
        <div className="flex flex-wrap gap-2">
          {SAMPLE.map((s) => (
            <button
              type="button"
              key={s.url}
              onClick={() => {
                setAgentName(s.name);
                setGithubUrl(s.url);
              }}
              className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20"
            >
              {s.name}
            </button>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs uppercase text-white/40">Agent name</span>
            <input
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              required
              className="mt-1 w-full rounded bg-black/40 border border-white/10 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase text-white/40">GitHub URL</span>
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              required
              pattern="https://github\.com/.+"
              className="mt-1 w-full rounded bg-black/40 border border-white/10 px-3 py-2 text-sm font-mono"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded bg-accent text-white text-sm font-medium hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? "Évaluation..." : "Lancer l'évaluation (mock)"}
        </button>
        {error && (
          <pre className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded p-3 overflow-auto">
            {error}
          </pre>
        )}
      </form>

      {result && <ResultView result={result} />}
    </div>
  );
}

function ResultView({ result }: { result: EvaluationResult }) {
  const ts = result.trust_score;
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs uppercase text-white/40">Agent</div>
            <div className="text-lg font-semibold">{result.agent_name}</div>
            <div className="text-xs font-mono text-white/40">
              {result.agent_id}
            </div>
          </div>
          <Gauge label="Trust Score global" value={ts.global} grade={ts.grade} />
        </div>
        <div className="grid grid-cols-3 gap-3 mt-5">
          <DimBar label="Technical" value={ts.technical} />
          <DimBar label="Legal" value={ts.legal} />
          <DimBar label="Ethical & social" value={ts.ethical_social} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Sub-scores">
          <ul className="text-sm space-y-1">
            {Object.entries(ts.sub_scores).map(([k, v]) => (
              <li key={k} className="flex justify-between gap-2">
                <span className="text-white/60">{k}</span>
                <span className="font-mono">{v}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title={`Bias flags (${result.bias_flags.length})`}>
          {result.bias_flags.length === 0 ? (
            <div className="text-sm text-emerald-300">Aucun warning.</div>
          ) : (
            <ul className="text-sm space-y-1">
              {result.bias_flags.map((b) => (
                <li key={b} className="text-amber-300">
                  ⚠ {b}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card
        title={`Policies matchées (${result.matched_policies.length}) · obligations (${result.matched_obligations.length})`}
      >
        <div className="flex flex-wrap gap-1">
          {result.matched_policies.slice(0, 30).map((p) => (
            <span
              key={p}
              className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-200 font-mono"
            >
              {p}
            </span>
          ))}
        </div>
      </Card>

      <Card title="Recommandation AI liability coverage">
        <ul className="space-y-3">
          {result.insurance_recommendations.map((r) => (
            <li
              key={r.catalog_id}
              className={`rounded border p-3 ${
                r.eligible
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : "border-red-500/40 bg-red-500/5"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="font-medium">{r.partner}</div>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    r.eligible
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-red-500/20 text-red-300"
                  }`}
                >
                  {r.eligible ? "ÉLIGIBLE" : "REJETÉ"}
                </span>
              </div>
              {r.rejected_reason && (
                <div className="text-xs text-red-300 mt-1">
                  {r.rejected_reason}
                </div>
              )}
              <div className="mt-2 flex flex-wrap gap-1">
                {r.matching_clauses.map((c) => (
                  <span
                    key={c}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 font-mono"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-3 text-[11px] text-white/40">
          Recommandation indicative — l&apos;AI Assurance Report final est signé
          par Cloud KMS (Phase 5).
        </div>
      </Card>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-5">
      <div className="text-sm font-semibold mb-3">{title}</div>
      {children}
    </div>
  );
}

function DimBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-white/60">
        <span>{label}</span>
        <span className="font-mono">{value}</span>
      </div>
      <div className="h-2 mt-1 rounded bg-white/10 overflow-hidden">
        <div
          className="h-full bg-accent"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function Gauge({
  label,
  value,
  grade,
}: {
  label: string;
  value: number;
  grade: string;
}) {
  const color =
    grade === "A"
      ? "text-emerald-300"
      : grade === "B"
        ? "text-sky-300"
        : grade === "C"
          ? "text-amber-300"
          : "text-red-300";
  return (
    <div className="text-right">
      <div className="text-xs uppercase text-white/40">{label}</div>
      <div className="flex items-baseline gap-2 justify-end">
        <span className="text-3xl font-bold">{value}</span>
        <span className={`text-2xl font-bold ${color}`}>{grade}</span>
      </div>
    </div>
  );
}
