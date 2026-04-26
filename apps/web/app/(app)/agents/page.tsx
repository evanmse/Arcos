import AgentsClient from "@/components/app/AgentsClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Agents — INTEGREAT" };

export default function AgentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <div className="pill">step 4 · certify</div>
        <h1 className="text-[26px] md:text-[28px] font-semibold tracking-tight mt-2">
          AI <span className="text-gradient">agents</span> registry
        </h1>
        <p className="text-[13.5px] text-white/55 mt-2 max-w-[680px]">
          Connect a GitHub repo containing one or more agents (look at{" "}
          <code className="font-mono text-white/80">samples/agents/</code> for a reference layout).
          We pull the agent metadata, run a Gemini 2.5-Pro analysis against your indexed regulations
          and policies, score it, and issue an insurability verdict.
        </p>
      </header>
      <AgentsClient />
    </div>
  );
}
