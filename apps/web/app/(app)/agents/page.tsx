import AgentsClient from "@/components/app/AgentsClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Agents — INTEGREAT" };

export default function AgentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <span className="pill">agents</span>
        <h1 className="text-[26px] md:text-[28px] font-semibold tracking-tight mt-2">
          AI <span className="text-gradient">agents</span>
        </h1>
        <p className="text-[13.5px] mt-2 max-w-[680px]" style={{ color: "var(--ink-500)" }}>
          Register an agent, then run a Gemini 2.5-Pro analysis against your indexed regulations to
          get a trust score and an insurability verdict.
        </p>
      </header>
      <AgentsClient />
    </div>
  );
}
