"use client";
import { useEffect, useState } from "react";

type TenantPolicy = {
  policy_id: string;
  label: string;
  description: string | null;
  enabled: boolean;
  mandatory: boolean;
  risk_categories: string[];
  mapped_obligations: string[];
  assigned_agents: string[];
  created_at: string;
};

type Agent = {
  agent_id: string;
  name: string;
};

const RISK_CATS = [
  "SECURITY",
  "BIAS",
  "TRANSPARENCY",
  "DATA_PROTECTION",
  "HUMAN_OVERSIGHT",
  "AI_GOVERNANCE",
  "AUDIT",
  "ICT_RISK",
  "THIRD_PARTY",
];

export default function PoliciesCRUD() {
  const [policies, setPolicies] = useState<TenantPolicy[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<TenantPolicy | "new" | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const [p, a] = await Promise.all([
        fetch("/api/tenant-policies", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/agents", { cache: "no-store" })
          .then((r) => r.json())
          .catch(() => ({ agents: [] })),
      ]);
      setPolicies(p.policies || []);
      setAgents(a.agents || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <section className="card-elevated p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="pill">your tenant</span>
          <h2 className="text-[18px] font-semibold mt-2">Custom policies</h2>
          <p className="text-[12.5px] text-white/55 mt-1 max-w-xl">
            Create, assign and manage your own AI policies. Each policy can be linked to risk
            categories, mapped to obligations and assigned to specific agents.
          </p>
        </div>
        <button onClick={() => setOpen("new")} className="btn-primary !py-2 !px-3.5 text-[12.5px]">
          + New policy
        </button>
      </div>

      {loading ? (
        <div className="text-[12px] text-white/45">Loading…</div>
      ) : policies.length === 0 ? (
        <div className="text-[12.5px] text-white/55 py-3">
          No custom policy yet. Create your first one to govern your AI agents.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {policies.map((p) => (
            <div key={p.policy_id} className="card p-4 flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <span className="text-[14.5px] font-semibold flex-1 truncate">{p.label}</span>
                {p.mandatory && <span className="chip chip-pink">mandatory</span>}
                <span
                  className={`chip ${p.enabled ? "chip-emerald" : ""}`}
                >
                  {p.enabled ? "enabled" : "disabled"}
                </span>
              </div>
              {p.description && (
                <div className="text-[12px] text-white/55 line-clamp-2">{p.description}</div>
              )}
              <div className="flex flex-wrap gap-1">
                {(p.risk_categories || []).slice(0, 4).map((c) => (
                  <span key={c} className="chip chip-violet">
                    {c.toLowerCase().replaceAll("_", " ")}
                  </span>
                ))}
              </div>
              <div className="text-[11.5px] text-white/45">
                {(p.assigned_agents || []).length} agent
                {(p.assigned_agents || []).length === 1 ? "" : "s"} assigned
              </div>
              <div className="flex gap-2 mt-1">
                <button className="btn-ghost !py-1.5 !px-3 text-[11.5px]" onClick={() => setOpen(p)}>
                  Edit
                </button>
                <button
                  className="btn-ghost !py-1.5 !px-3 text-[11.5px] text-red-300"
                  onClick={async () => {
                    if (!confirm(`Delete "${p.label}"?`)) return;
                    await fetch(`/api/tenant-policies/${p.policy_id}`, {
                      method: "DELETE",
                    });
                    refresh();
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <PolicyEditor
          initial={open === "new" ? null : open}
          agents={agents}
          onClose={() => {
            setOpen(null);
            refresh();
          }}
        />
      )}
    </section>
  );
}

function PolicyEditor({
  initial,
  agents,
  onClose,
}: {
  initial: TenantPolicy | null;
  agents: Agent[];
  onClose: () => void;
}) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);
  const [mandatory, setMandatory] = useState(initial?.mandatory ?? false);
  const [cats, setCats] = useState<string[]>(initial?.risk_categories ?? []);
  const [assigned, setAssigned] = useState<string[]>(initial?.assigned_agents ?? []);
  const [busy, setBusy] = useState(false);

  const toggle = (arr: string[], setArr: (a: string[]) => void, v: string) => {
    setArr(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  };

  const save = async () => {
    if (!label.trim()) return;
    setBusy(true);
    try {
      if (initial) {
        await fetch(`/api/tenant-policies/${initial.policy_id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            label,
            description,
            enabled,
            mandatory,
            risk_categories: cats,
            assigned_agents: assigned,
          }),
        });
      } else {
        await fetch("/api/tenant-policies", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            label,
            description,
            enabled,
            mandatory,
            risk_categories: cats,
            assigned_agents: assigned,
          }),
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
            {initial ? "Edit policy" : "New policy"}
          </h3>
          <button onClick={onClose} className="text-white/45 hover:text-white text-xl">
            ×
          </button>
        </div>
        <div className="grid gap-3">
          <div>
            <label className="text-[11px] uppercase tracking-[0.12em] text-white/45">Label</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="input mt-1"
              placeholder="e.g. Mandatory human-in-the-loop on credit decisions"
            />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-[0.12em] text-white/45">
              Description
            </label>
            <textarea
              value={description ?? ""}
              onChange={(e) => setDescription(e.target.value)}
              className="input mt-1"
              rows={3}
              placeholder="Scope, rationale, enforcement details…"
            />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-[12.5px]">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              Enabled
            </label>
            <label className="flex items-center gap-2 text-[12.5px]">
              <input
                type="checkbox"
                checked={mandatory}
                onChange={(e) => setMandatory(e.target.checked)}
              />
              Mandatory
            </label>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-[0.12em] text-white/45">
              Risk categories
            </label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {RISK_CATS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggle(cats, setCats, c)}
                  className={`chip ${cats.includes(c) ? "chip-violet" : ""}`}
                >
                  {c.toLowerCase().replaceAll("_", " ")}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-[0.12em] text-white/45">
              Assign to agents
            </label>
            {agents.length === 0 ? (
              <div className="text-[12px] text-white/45 mt-1">
                No agent registered yet — register agents from the Agents tab first.
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {agents.map((a) => (
                  <button
                    key={a.agent_id}
                    type="button"
                    onClick={() => toggle(assigned, setAssigned, a.agent_id)}
                    className={`chip ${assigned.includes(a.agent_id) ? "chip-emerald" : ""}`}
                  >
                    {a.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={busy || !label.trim()} onClick={save}>
            {busy ? "Saving…" : initial ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
