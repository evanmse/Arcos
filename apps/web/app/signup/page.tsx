"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    const r = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: f.get("email"),
        password: f.get("password"),
        name: f.get("name"),
      }),
    });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setError(d.error || "Signup failed.");
      setBusy(false);
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10 dot-grid" style={{ background: "var(--bone-50)" }}>
      <div className="w-full max-w-[420px]">
        <Link href="/" className="flex items-center gap-2 mb-7 justify-center wm">
          <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
            <rect x={3.5} y={3.5} width={17} height={17} rx={3.2} />
            <path d="M8 12.2 L11 15.2 L16.5 8.8" />
          </svg>
          <span className="text-[18px] font-semibold tracking-tight">
            inte<span className="great">great</span>
          </span>
        </Link>
        <div className="card-elevated p-7">
          <div className="text-center mb-6">
            <h1 className="text-[22px] font-semibold tracking-tight">Create your account</h1>
            <p className="text-[13px] mt-1" style={{ color: "var(--ink-500)" }}>
              Spin up a workspace and connect your stack in 60 seconds.
            </p>
          </div>
          <form className="flex flex-col gap-3.5" onSubmit={submit}>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px]" style={{ color: "var(--ink-700)" }}>Display name</span>
              <input className="input" name="name" required placeholder="Jane Doe" autoFocus />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px]" style={{ color: "var(--ink-700)" }}>Work email</span>
              <input className="input" name="email" type="email" required placeholder="you@company.com" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px]" style={{ color: "var(--ink-700)" }}>Password</span>
              <input className="input" name="password" type="password" required minLength={8} placeholder="≥ 8 characters" />
            </label>
            {error && (
              <div
                className="text-[12px] rounded-md px-3 py-2"
                style={{
                  color: "oklch(40% 0.18 27)",
                  background: "var(--risk-high-bg)",
                  border: "1px solid oklch(82% 0.10 27)",
                }}
              >
                {error}
              </div>
            )}
            <button type="submit" className="btn-primary justify-center mt-1" disabled={busy}>
              {busy ? "Creating…" : "Create account"}
            </button>
          </form>
          <div className="divider-glow my-5" />
          <div className="text-[12px] text-center" style={{ color: "var(--ink-500)" }}>
            Already have an account?{" "}
            <Link href="/login" className="underline" style={{ color: "var(--ink-900)" }}>Sign in</Link>
          </div>
        </div>
        <div className="text-center mt-5 text-[12px]" style={{ color: "var(--ink-500)" }}>
          <Link href="/" className="hover:underline">← Back to website</Link>
        </div>
      </div>
    </div>
  );
}
