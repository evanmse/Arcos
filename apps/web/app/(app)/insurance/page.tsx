import InsuranceClient from "@/components/app/InsuranceClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Insurance — INTEGREAT" };

export default function InsurancePage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <div className="pill">step 5 · cover</div>
        <h1 className="text-[26px] md:text-[28px] font-semibold tracking-tight mt-2">
          AI <span className="text-gradient">insurance</span> contracts
        </h1>
        <p className="text-[13.5px] text-white/55 mt-2 max-w-[680px]">
          Each registered agent can be covered by an AI-liability insurance contract calibrated by
          Gemini against its trust score, risk class and the obligations it touches. Quote
          automatically with one click — adjust manually before binding.
        </p>
      </header>
      <InsuranceClient />
    </div>
  );
}
