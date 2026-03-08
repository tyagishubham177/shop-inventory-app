"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type LoginFormProps = {
  redirectTo: string;
};

type LoginResponse = {
  error?: string;
};

export function LoginForm({ redirectTo }: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setError(null);

    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setError("Enter both email and password.");
      return;
    }

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as LoginResponse;

    if (!response.ok) {
      setError(data.error ?? "Sign-in failed. Please try again.");
      return;
    }

    startTransition(() => {
      router.replace(redirectTo);
      router.refresh();
    });
  }

  return (
    <form
      action={handleSubmit}
      className="grid gap-4 rounded-[30px] border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,247,241,0.96))] p-5 shadow-[var(--shadow)] backdrop-blur sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]">
            Shop workspace
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold text-[color:var(--foreground)]">
            Sign in on mobile without friction.
          </h2>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
            Your session stays role-aware and protected as soon as the sign-in completes.
          </p>
        </div>
        <span className="ui-badge ui-badge-primary">Secure</span>
      </div>

      <div>
        <label
          htmlFor="email"
          className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@shop.local"
          className="mt-2 w-full rounded-[22px] border border-[color:var(--border)] bg-white px-4 py-3 text-base text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--primary)] focus:ring-4 focus:ring-[color:rgba(15,118,110,0.12)]"
          disabled={isPending}
          required
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          className="mt-2 w-full rounded-[22px] border border-[color:var(--border)] bg-white px-4 py-3 text-base text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--primary)] focus:ring-4 focus:ring-[color:rgba(15,118,110,0.12)]"
          disabled={isPending}
          required
        />
      </div>

      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        className="ui-button ui-button-primary w-full"
        disabled={isPending}
        aria-busy={isPending}
      >
        {isPending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
