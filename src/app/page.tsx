import { ActionLink } from "@/components/action-link";
import { LogoutButton } from "@/components/logout-button";
import { SectionCard } from "@/components/section-card";
import { StatusPill } from "@/components/status-pill";
import { requireCurrentUser } from "@/lib/auth/current-user";

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const protectedChecks = [
  "Signed cookie session is required before the dashboard loads.",
  "The current user is resolved on the server from the session token.",
  "Admin-only routes are hidden or blocked for other roles.",
];

const phasePreview = [
  "Inventory CRUD and stock history",
  "Manual and linked sales entry",
  "Dashboard summaries and low-stock alerts",
];

function readStringValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Home({ searchParams }: HomePageProps) {
  const user = await requireCurrentUser();
  const resolvedSearchParams = (await searchParams) ?? {};
  const adminNotice = readStringValue(resolvedSearchParams.notice) === "admin-only";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <section className="overflow-hidden rounded-[32px] border border-[color:var(--border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(255,247,237,0.9))] p-6 shadow-[var(--shadow)] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <StatusPill label={`Signed in as ${user.role}`} />
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Welcome back, {user.name}.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[color:var(--muted)] sm:text-lg">
              Phase 1 is now live with app-managed login, session cookies, and route protection
              across the internal workspace.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            {user.role === "admin" ? <ActionLink href="/admin">Open admin check</ActionLink> : null}
            <LogoutButton />
          </div>
        </div>
      </section>

      {adminNotice ? (
        <section className="rounded-[28px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900 shadow-[var(--shadow)]">
          This route is limited to admins. Sign in with the admin demo user to verify access.
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <SectionCard eyebrow="Phase 1 checks" title="What this dashboard proves">
          <ul className="space-y-3">
            {protectedChecks.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-2 h-2.5 w-2.5 rounded-full bg-[color:var(--accent)]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard eyebrow="Current user" title="Session snapshot">
          <div className="grid gap-3">
            <div className="rounded-2xl bg-[color:var(--surface-strong)] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Name</p>
              <p className="mt-2 text-base font-semibold text-[color:var(--foreground)]">
                {user.name}
              </p>
            </div>
            <div className="rounded-2xl bg-[color:var(--surface-strong)] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Email</p>
              <p className="mt-2 text-base font-semibold text-[color:var(--foreground)]">
                {user.email}
              </p>
            </div>
            <div className="rounded-2xl bg-[color:rgba(15,118,110,0.08)] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Role</p>
              <p className="mt-2 text-3xl font-bold text-[color:var(--foreground)]">{user.role}</p>
            </div>
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <SectionCard eyebrow="Next phases" title="What unlocks after auth">
          <ul className="space-y-2">
            {phasePreview.map((item) => (
              <li
                key={item}
                className="rounded-2xl bg-[color:var(--surface-strong)] px-4 py-3 font-medium text-[color:var(--foreground)]"
              >
                {item}
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard eyebrow="Human test hint" title="Quick role verification">
          <p>
            Sign in as staff and visit <strong>/admin</strong>. The app should redirect you back
            here with an access warning instead of showing the admin page.
          </p>
          <p className="mt-3">
            Then sign in as admin and repeat the same step to confirm the protected route opens.
          </p>
        </SectionCard>
      </section>
    </main>
  );
}
