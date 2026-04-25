import Link from "next/link";
import { listRegulations } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const FALLBACK = [
  { regulation_id: "ai_act", celex: "32024R1689", short_name: "EU AI Act", title: "Regulation laying down harmonised rules on artificial intelligence", lang: "en", publication_date: "2024-07-12", source_url: null },
  { regulation_id: "dora", celex: "32022R2554", short_name: "DORA", title: "Digital Operational Resilience Act for the financial sector", lang: "en", publication_date: "2022-12-27", source_url: null },
  { regulation_id: "mica", celex: "32023R1114", short_name: "MiCA", title: "Markets in Crypto-Assets Regulation", lang: "en", publication_date: "2023-06-09", source_url: null },
  { regulation_id: "rgpd", celex: "32016R0679", short_name: "GDPR", title: "General Data Protection Regulation", lang: "en", publication_date: "2016-04-27", source_url: null },
];

export default async function RegulationsPage() {
  let rows = FALLBACK as Awaited<ReturnType<typeof listRegulations>>;
  try {
    const live = await listRegulations();
    if (live.length) rows = live;
  } catch {
    // DB unreachable
  }
  return (
    <div>
      <span className="pill">Corpus</span>
      <h1 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">Regulations</h1>
      <p className="mt-2 text-[14px] text-white/55 max-w-2xl">
        Each regulation is ingested article-by-article, embedded with text-embedding-005 and
        decomposed by Gemini 2.5 Flash into atomic obligations.
      </p>
      <div className="mt-10 grid md:grid-cols-2 gap-3">
        {rows.map((r) => (
          <Link
            key={r.regulation_id}
            href={`/regulations/${r.regulation_id}`}
            className="glass glass-hover rounded-2xl p-6 group"
          >
            <div className="flex items-center justify-between">
              <span className="pill">{r.celex || r.regulation_id}</span>
              <span className="text-[11px] font-mono text-white/40">{r.lang || "en"}</span>
            </div>
            <div className="mt-4 text-lg font-semibold tracking-tight">{r.short_name}</div>
            <div className="mt-1 text-[13px] text-white/55 line-clamp-3">{r.title}</div>
            <div className="mt-5 flex items-center gap-2 text-[12px] text-white/40 group-hover:text-white/80 transition">
              {r.publication_date ? new Date(r.publication_date).toLocaleDateString() : "—"}
              <span className="ml-auto">Open →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
