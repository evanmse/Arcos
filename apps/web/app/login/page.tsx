import Link from "next/link";

export const metadata = { title: "Sign in — Integreat" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; next?: string };
}) {
  const hasError = searchParams.error === "1";
  const next = searchParams.next || "/dashboard";
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10 dot-grid"
      style={{ background: "var(--bone-50)" }}>
      <div className="relative z-10 w-full max-w-[420px]">
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
            <h1 className="text-[22px] font-semibold tracking-tight">Welcome back</h1>
            <p className="text-[13px] mt-1" style={{ color: "var(--ink-500)" }}>
              Sign in to access your trust workspace.
            </p>
          </div>
          <div
            className="mb-5 rounded-md px-3.5 py-3 text-[12px]"
            style={{
              background: "var(--indigo-soft)",
              border: "1px solid oklch(85% 0.06 268)",
              color: "var(--indigo-deep)",
            }}
          >
            <div className="font-medium mb-1 flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "var(--indigo)" }} />
              Demo access
            </div>
            <div className="leading-relaxed">
              Use any email address with the password <span className="kbd">demo</span>. New users
              are auto-provisioned for the preview.
            </div>
          </div>
          <form action="/api/auth/login" method="post" className="flex flex-col gap-3.5">
            <input type="hidden" name="next" value={next} />
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px]" style={{ color: "var(--ink-700)" }}>Work email</span>
              <input className="input" type="email" name="email" required placeholder="you@company.com" autoFocus />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] flex justify-between" style={{ color: "var(--ink-700)" }}>
                <span>Password</span>
                <span className="text-[11px]" style={{ color: "var(--ink-400)" }}>
                  demo: <span className="kbd">demo</span>
                </span>
              </span>
              <input className="input" type="password" name="password" required placeholder="••••••••" />
            </label>
            {hasError ? (
              <div
                className="text-[12px] rounded-md px-3 py-2"
                style={{
                  color: "oklch(40% 0.18 27)",
                  background: "var(--risk-high-bg)",
                  border: "1px solid oklch(82% 0.10 27)",
                }}
              >
                Invalid email or password.
              </div>
            ) : null}
            <button type="submit" className="btn-primary justify-center mt-1">
              Continue
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </form>
          <div className="divider-glow my-5" />
          <div className="text-[12px] text-center" style={{ color: "var(--ink-500)" }}>
            New here?{" "}
            <Link href="/signup" className="underline" style={{ color: "var(--ink-900)" }}>
              Create an account
            </Link>
          </div>
          <div className="text-[11.5px] text-center mt-2" style={{ color: "var(--ink-400)" }}>
            By continuing you accept the <a className="underline" href="#">terms</a> and{" "}
            <a className="underline" href="#">privacy</a> policy.
          </div>
        </div>
        <div className="text-center mt-5 text-[12px]" style={{ color: "var(--ink-500)" }}>
          <Link href="/" className="hover:underline">← Back to website</Link>
        </div>
      </div>
    </div>
  );
}
