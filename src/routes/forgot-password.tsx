import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import whoLogo from "@/assets/who-kenya-logo.png";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — WHO Kenya" }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined,
    });
    setLoading(false);
    if (error) setError(error.message);
    else setInfo("If that email exists, we've sent a reset link.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <main className="w-full max-w-[440px]">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
          <div className="mb-6 flex flex-col items-center text-center">
            <img src={whoLogo} alt="WHO Kenya" className="mb-3 h-14 w-14 object-contain" />
            <h1 className="text-headline-sm font-semibold text-on-surface">Reset your password</h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              We'll email you a secure link.
            </p>
          </div>
          <form className="space-y-5" onSubmit={onSubmit}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@who.int"
              className="block w-full rounded border border-outline-variant bg-surface px-3 py-2.5 text-body-md text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary"
            />
            {error ? <div className="rounded bg-error-container px-3 py-2 text-sm text-on-error-container">{error}</div> : null}
            {info ? <div className="rounded bg-surface-container-low px-3 py-2 text-sm text-on-surface">{info}</div> : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary-container py-3 text-headline-sm font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
          <p className="mt-6 text-center text-body-md text-on-surface-variant">
            <Link to="/login" className="font-semibold text-secondary hover:underline">Back to sign in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
