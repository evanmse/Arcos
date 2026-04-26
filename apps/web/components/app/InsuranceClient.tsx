"use client";
import { useEffect, useMemo, useState } from "react";

type Contract = {
  contract_id: string;
  agent_id: string | null;
  agent_name: string | null;
  agent_repo: string | null;
  product_name: string;
  carrier: string | null;
  status: string;
  coverage: Record<string, number>;
  exclusions: string[];
  premium_eur: number;
  liability_cap_eur: number;
  deductible_eur: number;
  effective_date: string | null;
  expiry_date: string | null;
  notes: string | null;
  created_at: string;
};

type Agent = {
  agent_id: string;
  name: string;
  trust_score: number | null;
  grade: string | null;
  risk_class: string | null;
  insurance_eligible: boolean | null;
};

const STATUS_TONES: Record<string, string> = {
  quoted: "chip-violet",
  bound: "chip-emerald",
  declined: "chip-pink",
  expired: "chip-amber",
};

export default function InsuranceClient() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [quoting, setQuoting] = useState<string | null>(null);
  const [editing, setEditing] = useState<Contract | "new" | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const [c, a] = await Promise.all([
        fetch("/api/insurance-contracts", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/agents", { cache: "no-store" }).then((r) => r.json()),
      ]);
      setContracts(c.contracts || []);
      setAgents(a.agents || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const totals = useMemo(() => {
    const annual = contracts
      .filter((c) => c.status === "bound" || c.status === "quoted")
      .reduce((s, c) => s + Number(c.premium_eur || 0), 0);
    const cap = contracts
      .filter((c) => c.status === "bound" || c.status === "quoted")
      .reduce((s, c) => s + Number(c.liability_cap_eur || 0), 0);
    const covered = contracts.filter((c) => c.agent_id && c.status === "bound").length;
    return { annual, cap, covered, total: contracts.length };
  }, [contracts]);

  const autoQuote = async (agent_id: string) => {
    setQuoting(agent_id);
    try {
      const r = await fetch("/api/insurance-contracts/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agent_id }),
      });
      const d = await r.json();
      if (!r.ok) {
        alert(d.error || "Quote failed");
      }
      refresh();
    } finally {
      setQuoting(null);
    }
  };

  const uncoveredAgents = useMemo(() => {
    const covered = new Set(contracts.map((c) => c.agent_id).filter(Boolean));
    return agents.filter((a) => a.trust_score != null && !covered.has(a.agent_id));
  }, [contracts, agents]);

  return (
    <>
      {/* Stats bar */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat num={`€${(totals.annual || 0).toLocaleString()}`} label="annual premium" />
        <Stat
          num={`€${((totals.cap || 0) / 1_000_000).toFixed(1)}M`}
          label="aggregate liability cap"
        />
        <Stat num={`${totals.covered}`} label="agents bound" />
        <Stat num={`${totals.total}`} label="contracts" />
      </section>

      {/* Agents needing coverage */}
      {uncoveredAgents.length > 0 && (
        <section className="card-elevated p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-semibold">Agents awaiting coverage</h2>
            <span className="text-[11.5px] text-white/45">
              one-click Gemini quote · {uncoveredAgents.length} left
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {uncoveredAgents.map((a) => (
              <div key={a.agent_id} className="card p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-semibold truncate">{a.name}</span>
                  {a.grade && <span className="chip">grade {a.grade}</span>}
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <Mini num={`${a.trust_score ?? "—"}`} label="trust" />
                  <Mini num={a.risk_class ?? "—"} label="risk" />
                  <Mini
                    num={a.insurance_eligible ? "Yes" : "No"}
                    label="eligible"
                  />
                </div>
                <button
                  className="btn-primary !py-1.5 !px-3 text-[12px] w-full"
                  disabled={quoting === a.agent_id || !a.insurance_eligible}
                  onClick={() => autoQuote(a.agent_id)}
                  title={
                    a.insurance_eligible
                      ? "Generate AI insurance quote with Gemini"
                      : "Agent declared uninsurable by analysis"
                  }
                >
                  {quoting === a.agent_id
                    ? "Quoting…"
                    : a.insurance_eligible
                    ? "Auto-quote with Gemini"
                    : "Not eligible"}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Contracts */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-semibold">Contracts</h2>
          <button
            className="btn-ghost !py-1.5 !px-3 text-[12px]"
            onClick={() => setEditing("new")}
          >
            + Add manual contract
          </button>
        </div>
        {loading ? (
          <div className="card p-5 text-[12.5px] text-white/55">Loading contracts…</div>
        ) : contracts.length === 0 ? (
          <div className="card p-5 text-[12.5px] text-white/55">
            No contract yet. Analyze an agent then click "Auto-quote".
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {contracts.map((c) => (
              <ContractCard
                key={c.contract_id}
                c={c}
                onEdit={() => setEditing(c)}
                onChanged={refresh}
              />
            ))}
          </div>
        )}
      </section>

      {editing && (
        <ContractEditor
          initial={editing === "new" ? null : editing}
          agents={agents}
          onClose={() => {
            setEditing(null);
            refresh();
          }}
        />
      )}
    </>
  );
}

function ContractCard({
  c,
  onEdit,
  onChanged,
}: {
  c: Contract;
  onEdit: () => void;
  onChanged: () => void;
}) {
  const tone = STATUS_TONES[c.status] ?? "";
  const coverageEntries = Object.entries(c.coverage || {});
  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[14.5px] font-semibold truncate">{c.product_name}</div>
          <div className="text-[11.5px] text-white/45 mt-0.5">
            {c.carrier || "—"} · {c.agent_name ? `for ${c.agent_name}` : "no agent linked"}
          </div>
        </div>
        <span className={`chip ${tone}`}>{c.status}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Mini num={`€${Number(c.premium_eur).toLocaleString()}`} label="premium /yr" />
        <Mini
          num={`€${(Number(c.liability_cap_eur) / 1_000_000).toFixed(1)}M`}
          label="cap"
        />
        <Mini num={`€${Number(c.deductible_eur).toLocaleString()}`} label="deductible" />
      </div>
      {coverageEntries.length > 0 && (
        <div className="text-[11.5px] text-white/55">
          <div className="text-[10.5px] uppercase tracking-wider text-white/35 mb-1">Covers</div>
          <div className="flex flex-wrap gap-1">
            {coverageEntries.slice(0, 5).map(([k, v]) => (
              <span key={k} className="chip">
                {k.replaceAll("_", " ")}: €{Number(v).toLocaleString()}
              </span>
            ))}
          </div>
        </div>
      )}
      {(c.exclusions ?? []).length > 0 && (
        <div className="text-[11px] text-white/45 line-clamp-2">
          <span className="text-pink-300">Exclusions:</span> {c.exclusions.join(", ")}
        </div>
      )}
      {c.notes && (
        <div className="text-[11.5px] text-white/55 line-clamp-3 italic">{c.notes}</div>
      )}
      <div className="flex gap-2 mt-auto">
        <button className="btn-ghost !py-1.5 !px-3 text-[11.5px]" onClick={onEdit}>
          Edit
        </button>
        {c.status === "quoted" && (
          <button
            className="btn-primary !py-1.5 !px-3 text-[11.5px]"
            onClick={async () => {
              await fetch(`/api/insurance-contracts/${c.contract_id}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ status: "bound" }),
              });
              onChanged();
            }}
          >
            Bind contract
          </button>
        )}
        <button
          className="btn-ghost !py-1.5 !px-3 text-[11.5px] text-red-300 ml-auto"
          onClick={async () => {
            if (!confirm(`Delete "${c.product_name}"?`)) return;
            await fetch(`/api/insurance-contracts/${c.contract_id}`, { method: "DELETE" });
            onChanged();
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function ContractEditor({
  initial,
  agents,
  onClose,
}: {
  initial: Contract | null;
  agents: Agent[];
  onClose: () => void;
}) {
  const [agentId, setAgentId] = useState<string | "">(initial?.agent_id ?? "");
  const [productName, setProductName] = useState(initial?.product_name ?? "");
  const [carrier, setCarrier] = useState(initial?.carrier ?? "Munich Re");
  const [status, setStatus] = useState(initial?.status ?? "quoted");
  const [premium, setPremium] = useState<number>(Number(initial?.premium_eur ?? 0));
  const [cap, setCap] = useState<number>(Number(initial?.liability_cap_eur ?? 1_000_000));
  const [deductible, setDeductible] = useState<number>(Number(initial?.deductible_eur ?? 5000));
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const payload = {
        agent_id: agentId || null,
        product_name: productName,
        carrier,
        status,
        premium_eur: premium,
        liability_cap_eur: cap,
        deductible_eur: deductible,
        notes,
      };
      if (initial) {
        await fetch(`/api/insurance-contracts/${initial.contract_id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/insurance-contracts", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4">
      <div className="card-elevated p-5 w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[15px] font-semibold">
            {initial ? "Edit contract" : "New manual contract"}
          </h3>
          <button onClick={onClose} className="text-white/45 hover:text-white text-xl">
            ×
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Linked agent">
            <select className="input" value={agentId} onChange={(e) => setAgentId(e.target.value)}>
              <option value="">— none —</option>
              {agents.map((a) => (
                <option key={a.agent_id} value={a.agent_id}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Product name">
            <input className="input" value={productName} onChange={(e) => setProductName(e.target.value)} />
          </Field>
          <Field label="Carrier">
            <input className="input" value={carrier} onChange={(e) => setCarrier(e.target.value)} />
          </Field>
          <Field label="Status">
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="quoted">quoted</option>
              <option value="bound">bound</option>
              <option value="declined">declined</option>
              <option value="expired">expired</option>
            </select>
          </Field>
          <Field label="Premium €/year">
            <input
              type="number"
              className="input"
              value={premium}
              onChange={(e) => setPremium(Number(e.target.value))}
            />
          </Field>
          <Field label="Liability cap €">
            <input
              type="number"
              className="input"
              value={cap}
              onChange={(e) => setCap(Number(e.target.value))}
            />
          </Field>
          <Field label="Deductible €">
            <input
              type="number"
              className="input"
              value={deductible}
              onChange={(e) => setDeductible(Number(e.target.value))}
            />
          </Field>
          <Field label="Notes" full>
            <textarea
              className="input"
              rows={3}
              value={notes ?? ""}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={busy || !productName} onClick={save}>
            {busy ? "Saving…" : initial ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`grid gap-1 ${full ? "md:col-span-2" : ""}`}>
      <span className="text-[11px] uppercase tracking-[0.12em] text-white/45">{label}</span>
      {children}
    </label>
  );
}

function Stat({ num, label }: { num: string; label: string }) {
  return (
    <div className="card p-4">
      <div className="text-[20px] font-semibold tabular truncate">{num}</div>
      <div className="text-[11px] uppercase tracking-wider text-white/45 mt-1">{label}</div>
    </div>
  );
}

function Mini({ num, label }: { num: string; label: string }) {
  return (
    <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-2 text-center">
      <div className="text-[14px] font-semibold tabular truncate">{num}</div>
      <div className="text-[10px] uppercase tracking-wider text-white/45 mt-0.5">{label}</div>
    </div>
  );
}
