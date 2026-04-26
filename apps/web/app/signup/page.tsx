import Link from "next/link";

export const metadata = { title: "Create account — INTEGREAT" };

export default function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string; next?: string };
}) {
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
            <h1 className="text-[22px] font-semibold tracking-tight">Create your workspace</h1>
            <p className="text-[13px] text-white/55 mt-1">
              Get an Integreat account to govern your AI agents.
            </p>
          </div>
          <form action="/api/auth/signup" method="post" className="flex flex-col gap-3.5">
            <input type="hidden" name="next" value={next} />
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] text-white/65">Full name</span>
              <input className="input" type="text" name="name" placeholder="Jane Doe" />
            </label>
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
              <span className="text-[12px] text-white/65">Password (min 4 chars)</span>
              <input
                className="input"
                type="password"
                name="password"
                required
                minLength={4}
                placeholder="••••••••"
              />
            </label>
            {searchParams.error ? (
              <div className="text-[12px] text-pink-300 bg-pink-500/10 border border-pink-500/30 rounded-md px-3 py-2">
                {searchParams.error}
              </div>
            ) : null}
            <button type="submit" className="btn-primary justify-center mt-1">
              Create account
            </button>
          </form>
          <div className="divider-glow my-5" />
          <div className="text-[12px] text-center text-white/55">
            Already have an account?{" "}
            <Link href="/login" className="text-white underline decoration-white/30">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
