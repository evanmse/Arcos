import Link from "next/link";
import { notFound } from "next/navigation";
import { getRegulation, listArticles, listObligations } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const RISK_COLORS: Record<string, string> = {
  SECURITY: "from-red-500/30 to-red-500/5 border-red-500/30",
  BIAS: "from-amber-500/30 to-amber-500/5 border-amber-500/30",
  HALLUCINATION: "from-fuchsia-500/30 to-fuchsia-500/5 border-fuchsia-500/30",
  TRANSPARENCY: "from-sky-500/30 to-sky-500/5 border-sky-500/30",
  DATA_PROTECTION: "from-emerald-500/30 to-emerald-500/5 border-emerald-500/30",
  HUMAN_OVERSIGHT: "from-violet-500/30 to-violet-500/5 border-violet-500/30",
  AI_GOVERNANCE: "from-indigo-500/30 to-indigo-500/5 border-indigo-500/30",
  AUDIT: "from-slate-500/30 to-slate-500/5 border-slate-500/30",
  ICT_RISK: "from-cyan-500/30 to-cyan-500/5 border-cyan-500/30",
  THIRD_PARTY: "from-orange-500/30 to-orange-500/5 border-orange-500/30",
  ETHICAL_SOCIAL: "from-pink-500/30 to-pink-500/5 border-pink-500/30",
};

export default async function RegulationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let regulation: Awaited<ReturnType<typeof getRegulation>> = null;
  let articles: Awaited<ReturnType<typeof listArticles>> = [];
  let obligations: Awaited<ReturnType<typeof listObligations>> = [];
  try {
    [regulation, articles, obligations] = await Promise.all([
      getRegulation(id),
      listArticles(id),
      listObligations(id),
    ]);
  } catch {
    // DB unreachable
  }
  if (!regulation) {
    return notFound();
  }

  const obligationsByArticle = new Map<string, typeof obligations>();
  for (const o of obligations) {
    const arr = obligationsByArticle.get(o.ref) ?? [];
    arr.push(o);
    obligationsByArticle.set(o.ref, arr);
  }

  const dims = new Map<string, number>();
  const cats = new Map<string, number>();
  for (const o of obligations) {
    if (o.dimension) dims.set(o.dimension, (dims.get(o.dimension) ?? 0) + 1);
    for (const c of o.risk_categories || []) cats.set(c, (cats.get(c) ?? 0) + 1);
  }

  return (
    <div className="space-y-12">
      <div>
        <Link href="/regulations" className="text-[12px] text-white/45 hover:text-white">
          ← All regulations
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="pill">{regulation.celex || regulation.regulation_id}</span>
          <span className="pill">{regulation.lang}</span>
          {regulation.publication_date && (
            <span className="pill">{new Date(regulation.publication_date).toLocaleDateString()}</span>
          )}
        </div>
        <h1 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight">
          {regulation.short_name}
        </h1>
        <p className="mt-2 text-[14px] text-white/55 max-w-3xl">{regulation.title}</p>
        {regulation.source_url && (
          <a
            href={regulation.source_url}
            target="_blank"
            rel="noreferrer"
            className="mt-4 btn-ghost"
          >
            Open on EUR-Lex ↗
          </a>
        )}
      </div>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Articles" value={articles.length} />
        <Stat label="Obligations" value={obligations.length} />
        <Stat label="Dimensions" value={dims.size} />
        <Stat label="Risk categories" value={cats.size} />
      </section>

      {/* Risk categories distribution */}
      {cats.size > 0 && (
        <section>
          <span className="pill">Risk distribution</span>
          <div className="mt-4 flex flex-wrap gap-2">
            {[...cats.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([k, v]) => (
                <span
                  key={k}
                  className={`rounded-lg border bg-gradient-to-br px-3 py-1.5 text-[12px] font-medium ${
                    RISK_COLORS[k] || "from-white/10 to-white/0 border-white/10"
                  }`}
                >
                  {k.replaceAll("_", " ").toLowerCase()} · <span className="tabular text-white/70">{v}</span>
                </span>
              ))}
          </div>
        </section>
      )}

      {/* Articles list */}
      <section>
        <span className="pill">Articles</span>
        <h2 className="mt-3 text-xl font-semibold tracking-tight">
          {articles.length} articles indexed
        </h2>
        <ul className="mt-6 grid gap-2">
          {articles.map((a) => {
            const obs = obligationsByArticle.get(a.article_number) || [];
            return (
              <li
                key={a.article_number}
                className="glass rounded-xl p-4 flex items-start gap-4"
              >
                <div className="mt-0.5 h-9 w-12 shrink-0 rounded-md bg-white/[0.04] grid place-items-center font-mono text-[12px] text-white/70">
                  {a.article_number}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] text-white/80 truncate">
                    {a.chapter || "—"}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {obs.slice(0, 3).map((o) => (
                      <span
                        key={o.obligation_id}
                        className="text-[11px] rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-white/60"
                      >
                        {(o.dimension || "unspecified").toLowerCase()}
                      </span>
                    ))}
                    {obs.length > 3 && (
                      <span className="text-[11px] text-white/40">+{obs.length - 3}</span>
                    )}
                  </div>
                </div>
                <div className="text-right text-[11px] text-white/40 tabular shrink-0">
                  {a.chunks} chunks
                  <div className="text-white/35">{obs.length} obligations</div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Sample obligations */}
      {obligations.length > 0 && (
        <section>
          <span className="pill">Sample obligations</span>
          <h2 className="mt-3 text-xl font-semibold tracking-tight">First {Math.min(8, obligations.length)} obligations</h2>
          <div className="mt-6 grid gap-3">
            {obligations.slice(0, 8).map((o) => (
              <article key={o.obligation_id} className="glass rounded-xl p-5">
                <div className="flex items-center gap-2">
                  <span className="pill">art. {o.ref}</span>
                  {o.dimension && <span className="pill">{o.dimension.toLowerCase()}</span>}
                  {o.deadline && <span className="pill">deadline {o.deadline}</span>}
                </div>
                <p className="mt-3 text-[14px] leading-6 text-white/80">{o.text}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(o.risk_categories || []).map((c) => (
                    <span
                      key={c}
                      className={`text-[11px] rounded-md border bg-gradient-to-br px-2 py-0.5 ${
                        RISK_COLORS[c] || "from-white/10 to-white/0 border-white/10"
                      }`}
                    >
                      {c.toLowerCase()}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="text-[10px] uppercase tracking-[0.08em] text-white/40">{label}</div>
      <div className="mt-2 text-2xl font-semibold tabular">{value.toLocaleString()}</div>
    </div>
  );
}
