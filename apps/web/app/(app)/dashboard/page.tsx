import Link from "next/link";
import { loadStats, listRegulations } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard — INTEGREAT" };

const RISK_PALETTE: Record<string, string> = {
  SECURITY: "from-rose-500/40 to-rose-500/0 border-rose-500/40",
  BIAS: "from-fuchsia-500/40 to-fuchsia-500/0 border-fuchsia-500/40",
  TRANSPARENCY: "from-sky-500/40 to-sky-500/0 border-sky-500/40",
  DATA_PROTECTION: "from-emerald-500/40 to-emerald-500/0 border-emerald-500/40",
  AUDIT: "from-amber-500/40 to-amber-500/0 border-amber-500/40",
  HUMAN_OVERSIGHT: "from-violet-500/40 to-violet-500/0 border-violet-500/40",
  ICT_RISK: "from-cyan-500/40 to-cyan-500/0 border-cyan-500/40",
  THIRD_PARTY: "from-orange-500/40 to-orange-500/0 border-orange-500/40",
};

async function safe<T>(p: Promise<T>, fb: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fb;
  }
}

export default async function DashboardPage() {
  const [stats, regs] = await Promise.all([
    safe(loadStats(), {
      regulations: 0,
      standards: 0,
      insurance_clauses: 0,
      chunks: 0,
      obligations: 0,
    }),
    safe(listRegulations(), [] as Awaited<ReturnType<typeof listRegulations>>),
  ]);

  const trustScore = 78;
  const trustDelta = +4;

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <section className="relative overflow-hidden card-elevated p-6 md:p-8">
        <div className="aurora absolute -inset-20 opacity-50" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-end gap-6 md:gap-10">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-[12px] text-white/55">
              <span className="pill !text-[10px]">trust workspace</span>
              <span>· acme-corp · 4 active agents</span>
            </div>
            <h1 className="text-[28px] md:text-[32px] font-semibold tracking-tight mt-3">
              <span className="text-gradient">Trust posture</span> at a glance
            </h1>
            <p className="text-[13.5px] text-white/55 mt-2 max-w-[560px]">
              Real-time view of risks, regulatory coverage and AI liability protection across your
              agent fleet.
            </p>
            <div className="flex flex-wrap gap-2 mt-5">
              <Link href="/agents" className="btn-primary !py-2 !px-3.5 text-[12.5px]">
                Generate report
              </Link>
              <Link href="/data" className="btn-ghost !py-2 !px-3.5 text-[12.5px]">
                Connect data source
              </Link>
              <Link href="/regulations" className="btn-ghost !py-2 !px-3.5 text-[12.5px]">
                Browse regulations
              </Link>
            </div>
          </div>
          {/* Trust score ring */}
          <div className="flex items-center gap-5">
            <div className="relative h-[126px] w-[126px] shrink-0">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(#7c5cff ${trustScore}%, rgba(255,255,255,0.07) ${trustScore}%)`,
                }}
              />
              <div className="absolute inset-[6px] rounded-full bg-[#0a0d15] border border-white/[0.08] grid place-items-center">
                <div className="text-center">
                  <div className="text-[28px] font-semibold tabular leading-none">{trustScore}</div>
                  <div className="text-[10px] uppercase tracking-widest text-white/45 mt-1">
                    Trust score
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 text-[12px]">
              <span className="chip chip-emerald">+{trustDelta} pts last 7 days</span>
              <span className="chip">EU AI Act · GPAI tier</span>
              <span className="chip chip-violet">Insurance ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <Kpi
          label="Regulations"
          value={stats.regulations}
          delta="+1 this week"
          deltaTone="ok"
          accent="violet"
        />
        <Kpi
          label="Obligations indexed"
          value={stats.obligations}
          delta="extracted by Gemini"
          accent="sky"
        />
        <Kpi
          label="Knowledge chunks"
          value={stats.chunks}
          delta="vector-searchable"
          accent="pink"
        />
        <Kpi label="Standards mapped" value={stats.standards} delta="ISO · NIST · EN" accent="amber" />
        <Kpi
          label="Insurance clauses"
          value={stats.insurance_clauses}
          delta="MunichRe · AIG"
          accent="emerald"
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pipeline status */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-white/45">
                Pipelines
              </div>
              <h2 className="text-[16px] font-semibold mt-0.5">Live execution status</h2>
            </div>
            <span className="chip chip-emerald">all systems operational</span>
          </div>
          <div className="flex flex-col divide-y divide-white/[0.05]">
            <PipelineRow
              name="risk-knowledge"
              status="success"
              detail="ai_act ingested · 113 articles · 2 421 chunks · 12m13s"
              progress={100}
            />
            <PipelineRow
              name="risk-knowledge"
              status="running"
              detail="dora · extracting obligations (8 workers)"
              progress={62}
            />
            <PipelineRow
              name="risk-knowledge"
              status="running"
              detail="rgpd · embedding chunks (text-embedding-005)"
              progress={38}
            />
            <PipelineRow
              name="risk-knowledge"
              status="queued"
              detail="mica · waiting for slot"
              progress={0}
            />
            <PipelineRow
              name="risk-scoring"
              status="idle"
              detail="awaiting policy upload"
              progress={0}
            />
            <PipelineRow
              name="agent-evaluation"
              status="idle"
              detail="last run: 4 days ago — score 78/100"
              progress={0}
            />
          </div>
        </div>

        {/* Risk distribution */}
        <div className="card p-5">
          <div className="text-[10px] uppercase tracking-[0.14em] text-white/45">Risk surface</div>
          <h2 className="text-[16px] font-semibold mt-0.5">Top exposed dimensions</h2>
          <div className="mt-4 flex flex-col gap-3">
            {[
              { k: "TRANSPARENCY", v: 42 },
              { k: "HUMAN_OVERSIGHT", v: 31 },
              { k: "DATA_PROTECTION", v: 24 },
              { k: "BIAS", v: 18 },
              { k: "SECURITY", v: 14 },
              { k: "AUDIT", v: 9 },
            ].map((r) => (
              <div key={r.k}>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="text-white/75">{r.k.replaceAll("_", " ")}</span>
                  <span className="text-white/45 tabular">{r.v}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${RISK_PALETTE[r.k] ?? ""}`}
                    style={{ width: `${(r.v / 50) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Regulations preview + activity */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-white/45">
                Regulatory corpus
              </div>
              <h2 className="text-[16px] font-semibold mt-0.5">Live from EUR-Lex Cellar</h2>
            </div>
            <Link className="btn-ghost !py-1.5 !px-3 text-[12px]" href="/regulations">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(regs.length
              ? regs
              : [
                  {
                    regulation_id: "ai_act",
                    short_name: "AI Act",
                    title: "Regulation (EU) 2024/1689",
                    celex: "32024R1689",
                  },
                  { regulation_id: "dora", short_name: "DORA", title: "Regulation (EU) 2022/2554", celex: "32022R2554" },
                  { regulation_id: "mica", short_name: "MiCA", title: "Regulation (EU) 2023/1114", celex: "32023R1114" },
                  { regulation_id: "rgpd", short_name: "GDPR", title: "Regulation (EU) 2016/679", celex: "32016R0679" },
                ]
            ).slice(0, 4).map((r: any) => (
              <Link
                key={r.regulation_id}
                href={`/regulations/${r.regulation_id}`}
                className="glass glass-hover rounded-xl p-4 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-semibold">{r.short_name}</span>
                  <span className="font-mono text-[10.5px] text-white/45">{r.celex}</span>
                </div>
                <div className="text-[12px] text-white/55 line-clamp-2">{r.title}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="chip chip-violet">EU Regulation</span>
                  <span className="chip">live</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="text-[10px] uppercase tracking-[0.14em] text-white/45">Activity</div>
          <h2 className="text-[16px] font-semibold mt-0.5">Last 24h</h2>
          <ol className="mt-4 flex flex-col gap-3 text-[12.5px]">
            {[
              { t: "now", txt: "Cloud Run job ingest-legal[dora] · running", k: "violet" },
              { t: "12m", txt: "Vertex Vector Search · 2 421 vectors upserted", k: "sky" },
              { t: "1h", txt: "Gemini 2.5 Flash · 113 obligations extracted", k: "emerald" },
              { t: "5h", txt: "Policy decision-tree updated by alice@", k: "amber" },
              { t: "1d", txt: "Trust report v3 generated · sent to risk@", k: "pink" },
            ].map((e, i) => (
              <li key={i} className="flex gap-3">
                <span
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full bg-${
                    e.k === "violet"
                      ? "violet"
                      : e.k === "sky"
                      ? "sky"
                      : e.k === "emerald"
                      ? "emerald"
                      : e.k === "amber"
                      ? "amber"
                      : "pink"
                  }-400`}
                />
                <div className="flex-1">
                  <div className="text-white/80">{e.txt}</div>
                  <div className="text-white/35 text-[11px]">{e.t}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  delta,
  deltaTone,
  accent,
}: {
  label: string;
  value: number;
  delta: string;
  deltaTone?: "ok" | "warn";
  accent?: "violet" | "sky" | "pink" | "amber" | "emerald";
}) {
  const accentMap: Record<string, string> = {
    violet: "from-violet-500/30",
    sky: "from-sky-500/30",
    pink: "from-pink-500/30",
    amber: "from-amber-500/30",
    emerald: "from-emerald-500/30",
  };
  return (
    <div className="card p-4 relative overflow-hidden">
      <div
        className={`absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br ${
          accent ? accentMap[accent] : "from-violet-500/30"
        } to-transparent blur-2xl pointer-events-none`}
      />
      <div className="relative">
        <div className="text-[10.5px] uppercase tracking-[0.14em] text-white/45">{label}</div>
        <div className="text-[26px] font-semibold tabular mt-1">{value.toLocaleString()}</div>
        <div className={`text-[11px] mt-1 ${deltaTone === "ok" ? "text-emerald-300" : "text-white/45"}`}>
          {delta}
        </div>
      </div>
    </div>
  );
}

function PipelineRow({
  name,
  status,
  detail,
  progress,
}: {
  name: string;
  status: "success" | "running" | "queued" | "idle" | "failed";
  detail: string;
  progress: number;
}) {
  const tone =
    status === "success"
      ? "bg-emerald-400"
      : status === "running"
      ? "bg-sky-400 animate-pulse"
      : status === "failed"
      ? "bg-rose-400"
      : status === "queued"
      ? "bg-amber-400"
      : "bg-white/30";
  const label =
    status === "running" ? "RUNNING" : status === "success" ? "OK" : status.toUpperCase();
  return (
    <div className="py-3 flex items-center gap-4">
      <span className={`h-2 w-2 rounded-full shrink-0 ${tone}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[13px]">
          <span className="font-medium">{name}</span>
          <span className="font-mono text-[10.5px] text-white/45">[{label}]</span>
        </div>
        <div className="text-[11.5px] text-white/45 mt-0.5 truncate">{detail}</div>
        {progress > 0 && progress < 100 ? (
          <div className="mt-1.5 h-[3px] rounded-full bg-white/[0.06] overflow-hidden max-w-[420px]">
            <div
              className="h-full bg-gradient-to-r from-violet-400 to-sky-400"
              style={{ width: `${progress}%` }}
            />
          </div>
        ) : null}
      </div>
      <span className="text-[11px] text-white/40 tabular shrink-0">
        {progress > 0 ? `${progress}%` : "—"}
      </span>
    </div>
  );
}
