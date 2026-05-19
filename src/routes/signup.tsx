import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import whoLogo from "@/assets/who-kenya-logo.png";
import { authErrorFromSupabase } from "@/lib/error-messages";
import { toast } from "@/lib/toast";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create Account — Updates" },
      { name: "description", content: "Request access to the Mpox portal." },
    ],
  }),
  component: SignupPage,
});

type FieldErrors = {
  email?: string;
  password?: string;
  confirm?: string;
};

function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: FieldErrors = {};
    if (password.length < 8) next.password = "Password must be at least 8 characters.";
    if (password !== confirm) next.confirm = "Passwords do not match.";
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    setErrors({});
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
    setLoading(false);
    if (error) {
      const mapped = authErrorFromSupabase(error.message);
      if (mapped.field === "email") setErrors({ email: mapped.text });
      else if (mapped.field === "password") setErrors({ password: mapped.text });
      else toast.error(mapped.text);
      return;
    }
    if (data.session) {
      toast.success("Account created. Welcome!");
      navigate({ to: "/" });
    } else {
      toast.success("Check your email to confirm your account, then sign in.");
    }
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
      <main className="w-full max-w-[460px]">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
          <div className="mb-7 flex flex-col items-center text-center">
            <img src={whoLogo} alt="WHO Kenya" className="mb-3 h-14 w-14 object-contain" />
            <h1 className="text-headline-sm font-semibold text-on-surface">Create your account</h1>
            <p className="text-label-caps uppercase tracking-widest text-on-surface-variant">
              Health Emergencies Portal
            </p>
          </div>

          <form className="space-y-5" onSubmit={onSubmit}>
            <Field id="full_name" label="Full Name" icon="person">
              <input
                id="full_name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. Jane Mwangi"
                className={inputCls}
              />
            </Field>
            <Field id="email" label="Official Email Address" icon="mail">
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@who.int"
                className={inputCls}
              />
              {errors.email ? <FieldError text={errors.email} /> : null}
            </Field>
            <Field id="password" label="Password" icon="lock">
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className={inputCls}
              />
              {errors.password ? <FieldError text={errors.password} /> : null}
            </Field>
            <Field id="confirm" label="Confirm Password" icon="lock">
              <input
                id="confirm"
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••••••"
                className={inputCls}
              />
              {errors.confirm ? <FieldError text={errors.confirm} /> : null}
            </Field>


            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-container py-3 text-headline-sm font-bold text-white shadow-sm transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-60"
            >
              {loading ? "Creating account…" : "Create Account"}
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>person_add</span>
            </button>
          </form>

          <p className="mt-6 text-center text-body-md text-on-surface-variant">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-secondary hover:underline">
              Sign in
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

const inputCls =
  "block w-full rounded border border-outline-variant bg-surface py-2.5 pl-10 pr-3 text-body-md text-on-surface outline-none transition-all focus:border-secondary focus:ring-2 focus:ring-secondary";

function Field({ id, label, icon, children }: { id: string; label: string; icon: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-label-caps uppercase text-on-surface-variant" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <span className="material-symbols-outlined pointer-events-none absolute inset-y-0 left-3 flex items-center text-outline">
          {icon}
        </span>
        {children}
      </div>
    </div>
  );
}

function FieldError({ text }: { text: string }) {
  return (
    <p className="mt-1.5 flex items-center gap-1 text-body-sm text-red-400">
      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>warning</span>
      {text}
    </p>
  );
}
