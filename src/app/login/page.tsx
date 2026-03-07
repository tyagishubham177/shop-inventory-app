import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { StatusPill } from "@/components/status-pill";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPhaseOneDemoCredentials } from "@/lib/auth/users";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readStringValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function sanitizeRedirect(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const redirectTo = sanitizeRedirect(readStringValue(resolvedSearchParams.next));
  const demoCredentials = getPhaseOneDemoCredentials();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-6 px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-8 lg:px-8">
      <section className="overflow-hidden rounded-[32px] border border-[color:var(--border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(255,247,237,0.92))] p-6 shadow-[var(--shadow)] sm:p-8">
        <StatusPill label="Phase 1 auth" />
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Sign in to the shop workspace.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[color:var(--muted)] sm:text-lg">
          This phase adds app-managed login, signed sessions, and role-aware route protection for
          the internal team.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-[28px] bg-[color:rgba(15,118,110,0.08)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]">
              What is live now
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-[color:var(--muted)]">
              <li>Signed cookie sessions for protected pages</li>
              <li>Server-side current-user resolution</li>
              <li>Role checks for admin-only routes</li>
            </ul>
          </div>

          <div className="rounded-[28px] bg-[color:var(--surface-strong)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]">
              Next phase swap
            </p>
            <p className="mt-4 text-sm leading-6 text-[color:var(--muted)]">
              Phase 2 will replace the temporary local demo-user source with real records from the
              users table in Supabase.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        <LoginForm redirectTo={redirectTo} />

        {demoCredentials.length ? (
          <section className="rounded-[28px] border border-dashed border-[color:rgba(15,118,110,0.28)] bg-[color:rgba(255,255,255,0.86)] p-5 shadow-[var(--shadow)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]">
              Dev demo accounts
            </p>
            <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
              These accounts are available only in local development so Phase 1 can be tested
              before the real database user table lands.
            </p>
            <div className="mt-4 grid gap-3">
              {demoCredentials.map((credential) => (
                <div
                  key={credential.email}
                  className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3"
                >
                  <p className="text-sm font-semibold text-[color:var(--foreground)]">
                    {credential.role}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">{credential.email}</p>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">{credential.password}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}
