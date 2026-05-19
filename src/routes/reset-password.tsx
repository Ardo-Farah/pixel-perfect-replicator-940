import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import whoLogo from "@/assets/who-kenya-logo.png";
import { toast } from "@/lib/toast";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Set new password — WHO Kenya" }] }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setConfirmError(null);
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setConfirmError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error("Couldn't update your password. Please try again.");
      return;
    }
    toast.success("Password updated successfully.");
    navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <main className="w-full max-w-[440px]">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
          <div className="mb-6 flex flex-col items-center text-center">
            <img src={whoLogo} alt="WHO Kenya" className="mb-3 h-14 w-14 object-contain" />
            <h1 className="text-headline-sm font-semibold text-on-surface">Set a new password</h1>
          </div>
          <form className="space-y-5" onSubmit={onSubmit}>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              className="block w-full rounded border border-outline-variant bg-surface px-3 py-2.5 text-body-md text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary"
            />
            {passwordError ? (
              <p className="flex items-center gap-1 text-body-sm text-red-400">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>warning</span>
                {passwordError}
              </p>
            ) : null}
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm new password"
              className="block w-full rounded border border-outline-variant bg-surface px-3 py-2.5 text-body-md text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary"
            />
            {confirmError ? (
              <p className="flex items-center gap-1 text-body-sm text-red-400">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>warning</span>
                {confirmError}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary-container py-3 text-headline-sm font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Saving…" : "Save new password"}
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
