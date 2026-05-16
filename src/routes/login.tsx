import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import whoLogo from "@/assets/who-kenya-logo.png";

type Search = { redirect?: string };

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    redirect: typeof s.redirect === "string" ? s.redirect : "/",
  }),
  head: () => ({
    meta: [
      { title: "Sign In — WHO Kenya Health Emergencies" },
      { name: "description", content: "Authorized access to the WHO Kenya Health Emergencies portal." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: search.redirect || "/" });
    });
  }, [navigate, search.redirect]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate({ to: search.redirect || "/" });
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center p-6"
      style={{
        backgroundColor: "var(--color-background)",
        backgroundImage:
          "radial-gradient(var(--color-outline-variant) 0.5px, transparent 0.5px), radial-gradient(var(--color-outline-variant) 0.5px, var(--color-background) 0.5px)",
        backgroundSize: "20px 20px",
        backgroundPosition: "0 0, 10px 10px",
      }}
    >
      <main className="w-full max-w-[440px]">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
          <div className="mb-8 flex flex-col items-center text-center">
            <img src={whoLogo} alt="WHO Kenya" className="mb-3 h-14 w-14 object-contain" />
            <h1 className="text-headline-sm font-semibold text-on-surface">WHO Kenya</h1>
            <p className="text-label-caps uppercase tracking-widest text-on-surface-variant">
              Health Emergencies Portal
            </p>
          </div>

          <form className="space-y-6" onSubmit={onSubmit}>
            <div>
              <label className="mb-2 block text-label-caps uppercase text-on-surface-variant" htmlFor="email">
                Official Email Address
              </label>
              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute inset-y-0 left-3 flex items-center text-outline">
                  mail
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@who.int"
                  className="block w-full rounded border border-outline-variant bg-surface py-2.5 pl-10 pr-3 text-body-md text-on-surface outline-none transition-all focus:border-secondary focus:ring-2 focus:ring-secondary"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-label-caps uppercase text-on-surface-variant" htmlFor="password">
                  Secure Password
                </label>
                <Link to="/forgot-password" className="text-label-caps text-secondary hover:underline">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute inset-y-0 left-3 flex items-center text-outline">
                  lock
                </span>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full rounded border border-outline-variant bg-surface py-2.5 pl-10 pr-3 text-body-md text-on-surface outline-none transition-all focus:border-secondary focus:ring-2 focus:ring-secondary"
                />
              </div>
            </div>

            {error ? (
              <div className="rounded bg-error-container px-3 py-2 text-sm text-on-error-container">{error}</div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-container py-3 text-headline-sm font-bold text-white shadow-sm transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign In to Portal"}
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>login</span>
            </button>
          </form>

          <div className="mt-8 border-t border-outline-variant pt-6">
            <div className="flex items-start gap-3 rounded-lg bg-surface-container-low p-4">
              <span
                className="material-symbols-outlined text-secondary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                info
              </span>
              <div>
                <p className="mb-1 text-label-caps uppercase text-on-secondary-container">Restricted Access</p>
                <p className="text-body-md text-on-surface-variant">
                  This system is intended for authorized WHO personnel and verified health partners only. All
                  activities are monitored.
                </p>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-body-md text-on-surface-variant">
            New here?{" "}
            <Link to="/signup" className="font-semibold text-secondary hover:underline">
              Create an account
            </Link>
          </p>
        </div>

        <p className="mt-8 text-center text-label-caps text-outline">
          © 2026 WORLD HEALTH ORGANIZATION KENYA OFFICE
        </p>
      </main>
    </div>
  );
}
