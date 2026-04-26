import { STANDARDS, loadStandard } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function StandardsPage() {
  const all = await Promise.all(
    STANDARDS.map(async (s) => ({
      ...s,
      sections: await loadStandard(s.id),
    })),
  );
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Standards indexés</h1>
      <div className="grid gap-4">
        {all.map((s) => (
          <div
            key={s.id}
            className="rounded-lg border border-white/10 bg-white/5"
          >
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <div className="font-semibold">{s.title}</div>
              <span className="text-xs text-white/40">
                {s.sections.length} sections
              </span>
            </div>
            <ul className="divide-y divide-white/5">
              {s.sections.map((sec) => (
                <li key={sec.section_id} className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-white/10">
                      {sec.section_id}
                    </span>
                    <span className="font-medium">{sec.title}</span>
                  </div>
                  {sec.chapter && (
                    <div className="text-xs text-white/40 mt-1">
                      {sec.chapter}
                    </div>
                  )}
                  <p className="text-sm text-white/70 mt-2">{sec.text}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
