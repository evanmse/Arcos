"use client";
import { useEffect, useState } from "react";

type Me = {
  email: string;
  display_name: string;
  role: string;
  preferences?: Record<string, any>;
};

type Integration = {
  integration_id: string;
  provider: string;
  label: string;
  metadata: Record<string, any>;
  has_token: boolean;
  created_at: string;
};

const PROVIDERS = [
  {
    id: "github",
    name: "GitHub",
    docs: "https://github.com/settings/tokens?type=beta",
    instructions: "Create a fine-grained PAT with read access to the repos you want to index.",
    fields: [{ key: "label", label: "Org / scope name", placeholder: "acme-org" }],
  },
  {
    id: "drive",
    name: "Google Drive",
    docs: "https://developers.google.com/identity/protocols/oauth2",
    instructions: "Paste an OAuth access token with scope drive.readonly. (You can mint one with gcloud auth print-access-token.)",
    fields: [{ key: "folder_id", label: "Folder ID (optional)", placeholder: "0AKx…" }],
  },
  {
    id: "notion",
    name: "Notion",
    docs: "https://www.notion.so/my-integrations",
    instructions: "Create an internal integration and share the workspace pages with it. Use the Internal Integration Secret.",
    fields: [],
  },
  {
    id: "slack",
    name: "Slack",
    docs: "https://api.slack.com/apps",
    instructions: "Create a Slack app → install in workspace → bot token (xoxb-…). Required scopes: channels:history, channels:read, users:read.",
    fields: [{ key: "channel_id", label: "Channel ID (optional)", placeholder: "C0XXXXXX" }],
  },
];

export default function SettingsClient() {
  const [me, setMe] = useState<Me | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileToast, setProfileToast] = useState<string | null>(null);
  const [pwToast, setPwToast] = useState<string | null>(null);

  const refresh = async () => {
    const r = await fetch("/api/me", { cache: "no-store" });
    const d = await r.json();
    if (r.ok) {
      setMe(d.me);
      setIntegrations(d.integrations || []);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  if (!me) return <div className="card p-5 text-[12.5px] text-white/55">Loading…</div>;

  const saveProfile = async (display_name: string) => {
    setSavingProfile(true);
    try {
      const r = await fetch("/api/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ display_name }),
      });
      setProfileToast(r.ok ? "Saved." : "Failed.");
    } finally {
      setSavingProfile(false);
      setTimeout(() => setProfileToast(null), 2500);
    }
  };

  const changePassword = async (current: string, next: string) => {
    const r = await fetch("/api/me", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ current_password: current, new_password: next }),
    });
    const d = await r.json().catch(() => ({}));
    setPwToast(r.ok ? "Password updated." : d.error || "Failed.");
    setTimeout(() => setPwToast(null), 3500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Profile */}
      <section className="card-elevated p-5">
        <h2 className="text-[16px] font-semibold mb-3">Profile</h2>
        <ProfileForm me={me} onSave={saveProfile} saving={savingProfile} />
        {profileToast && (
          <div className="mt-2 text-[12px] text-emerald-300">{profileToast}</div>
        )}
      </section>

      {/* Password */}
      <section className="card-elevated p-5">
        <h2 className="text-[16px] font-semibold mb-3">Change password</h2>
        <PasswordForm onSubmit={changePassword} />
        {pwToast && <div className="mt-2 text-[12px] text-emerald-300">{pwToast}</div>}
      </section>

      {/* Integrations */}
      <section className="card-elevated p-5 lg:col-span-2">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h2 className="text-[16px] font-semibold">Provider credentials</h2>
            <p className="text-[12px] text-white/55 mt-1 max-w-2xl">
              Stored encrypted at rest in Cloud SQL. Used by the data-connector to call provider
              APIs on your behalf and ingest documents into the corporate knowledge base.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PROVIDERS.map((p) => {
            const cur = integrations.find((i) => i.provider === p.id);
            return (
              <ProviderCard
                key={p.id}
                provider={p}
                current={cur}
                onSaved={refresh}
                onDeleted={refresh}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}

function ProfileForm({
  me,
  onSave,
  saving,
}: {
  me: Me;
  onSave: (n: string) => void;
  saving: boolean;
}) {
  const [name, setName] = useState(me.display_name ?? "");
  return (
    <div className="grid gap-3">
      <Field label="Email">
        <input className="input" value={me.email} disabled />
      </Field>
      <Field label="Display name">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Role">
        <input className="input" value={me.role} disabled />
      </Field>
      <div className="flex justify-end">
        <button className="btn-primary" disabled={saving} onClick={() => onSave(name)}>
          {saving ? "Saving…" : "Save profile"}
        </button>
      </div>
    </div>
  );
}

function PasswordForm({ onSubmit }: { onSubmit: (cur: string, n: string) => void }) {
  const [cur, setCur] = useState("");
  const [n, setN] = useState("");
  return (
    <div className="grid gap-3">
      <Field label="Current password">
        <input
          className="input"
          type="password"
          value={cur}
          onChange={(e) => setCur(e.target.value)}
        />
      </Field>
      <Field label="New password (min 4)">
        <input
          className="input"
          type="password"
          value={n}
          onChange={(e) => setN(e.target.value)}
        />
      </Field>
      <div className="flex justify-end">
        <button
          className="btn-primary"
          disabled={!cur || n.length < 4}
          onClick={() => onSubmit(cur, n)}
        >
          Update password
        </button>
      </div>
    </div>
  );
}

function ProviderCard({
  provider,
  current,
  onSaved,
  onDeleted,
}: {
  provider: (typeof PROVIDERS)[number];
  current?: Integration;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const [token, setToken] = useState("");
  const [extra, setExtra] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/me", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          provider: provider.id,
          label: provider.name,
          access_token: token,
          metadata: extra,
        }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setErr(d.error || "Failed to save token");
      } else {
        setToken("");
        setExtra({});
        onSaved();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[14.5px] font-semibold">{provider.name}</span>
          {current?.has_token && <span className="chip chip-emerald">connected</span>}
        </div>
        <a
          href={provider.docs}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] text-white/45 hover:text-white"
        >
          docs ↗
        </a>
      </div>
      <p className="text-[12px] text-white/55 mb-3">{provider.instructions}</p>
      {current ? (
        <div className="flex items-center justify-between gap-2">
          <div className="text-[11.5px] text-white/55 font-mono truncate flex-1">
            ••••••••••• · added {new Date(current.created_at).toLocaleDateString()}
          </div>
          <button
            className="btn-ghost !py-1.5 !px-3 text-[11.5px] text-red-300"
            onClick={async () => {
              if (!confirm(`Disconnect ${provider.name}?`)) return;
              await fetch(`/api/me?id=${current.integration_id}`, { method: "DELETE" });
              onDeleted();
            }}
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="grid gap-2">
          <input
            className="input"
            placeholder="Access token / API key"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            type="password"
          />
          {provider.fields.map((f) => (
            <input
              key={f.key}
              className="input"
              placeholder={f.label}
              value={extra[f.key] ?? ""}
              onChange={(e) => setExtra((s) => ({ ...s, [f.key]: e.target.value }))}
            />
          ))}
          {err && <div className="text-[11.5px] text-red-300">{err}</div>}
          <div className="flex justify-end">
            <button
              className="btn-primary !py-1.5 !px-3 text-[12px]"
              disabled={!token || busy}
              onClick={save}
            >
              {busy ? "Saving…" : "Save & connect"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] uppercase tracking-[0.12em] text-white/45">{label}</span>
      {children}
    </label>
  );
}
