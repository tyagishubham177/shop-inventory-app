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
      className="grid gap-4 rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)] backdrop-blur sm:p-6"
    >
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
          className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-base text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--primary)] focus:ring-4 focus:ring-[color:rgba(15,118,110,0.12)]"
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
          className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-base text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--primary)] focus:ring-4 focus:ring-[color:rgba(15,118,110,0.12)]"
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
        className="inline-flex min-h-12 items-center justify-center rounded-full bg-[color:var(--primary)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow)] transition hover:bg-[color:var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isPending}
      >
        {isPending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
