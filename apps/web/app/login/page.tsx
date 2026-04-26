import Link from "next/link";

export const metadata = { title: "Sign in — INTEGREAT" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; next?: string };
}) {
  const hasError = searchParams.error === "1";
  const next = searchParams.next || "/dashboard";
  return (
    <div className="grid-backdrop relative min-h-screen flex items-center justify-center px-6 py-10">
      <div className="aurora absolute inset-0" />
      <div className="relative z-10 w-full max-w-[420px]">
        <Link href="/" className="flex items-center gap-2 mb-7 justify-center">
          <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 via-sky-400 to-pink-400 text-[14px] font-bold text-white shadow-lg shadow-violet-500/30">
            I
          </span>
          <span className="font-semibold tracking-tight text-[18px]">INTEGREAT</span>
        </Link>
        <div className="card-elevated p-7">
          <div className="text-center mb-6">
            <h1 className="text-[22px] font-semibold tracking-tight">Welcome back</h1>
            <p className="text-[13px] text-white/55 mt-1">Sign in to access your trust workspace.</p>
          </div>
          <form action="/api/auth/login" method="post" className="flex flex-col gap-3.5">
            <input type="hidden" name="next" value={next} />
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] text-white/65">Work email</span>
              <input
                className="input"
                type="email"
                name="email"
                required
                placeholder="you@company.com"
                autoFocus
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] text-white/65 flex justify-between">
                <span>Password</span>
                <span className="text-white/35 text-[11px]">demo: <span className="kbd">demo</span></span>
              </span>
              <input
                className="input"
                type="password"
                name="password"
                required
                placeholder="••••••••"
              />
            </label>
            {hasError ? (
              <div className="text-[12px] text-pink-300 bg-pink-500/10 border border-pink-500/30 rounded-md px-3 py-2">
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
          <div className="text-[12px] text-center text-white/45">
            By continuing you accept the{" "}
            <a className="underline decoration-white/30" href="#">terms</a> and{" "}
            <a className="underline decoration-white/30" href="#">privacy</a> policy.
          </div>
        </div>
        <div className="text-center mt-5 text-[12px] text-white/45">
          <Link href="/" className="hover:text-white">← Back to website</Link>
        </div>
      </div>
    </div>
  );
}
