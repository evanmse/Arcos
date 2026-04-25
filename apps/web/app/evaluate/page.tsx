import { EvaluateForm } from "@/components/EvaluateForm";

export default function EvaluatePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Évaluer un agent IA</h1>
        <p className="text-sm text-white/60 mt-1">
          Le mock évaluateur applique les policies actuellement activées,
          calcule un Trust Score 3D déterministe (technical / legal /
          ethical_social) puis matche avec les catalogues assureurs. En Phase 5
          ce sera remplacé par le pipeline LangGraph + sandbox gVisor.
        </p>
      </div>
      <EvaluateForm />
    </div>
  );
}
