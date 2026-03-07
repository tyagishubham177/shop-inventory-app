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
  "Sales history with manual and linked entries",
  "Dashboard summaries and low-stock alerts",
  "Read-only chat over approved inventory and sales queries",
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
              Phases 1 to 3 are in place with app-managed auth, session cookies, route protection,
              and the full inventory workspace. Phase 4 now opens the sales flow.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <ActionLink href="/inventory" muted>
              Open inventory
            </ActionLink>
            <ActionLink href="/sales">Open sales</ActionLink>
            {user.role === "admin" ? <ActionLink href="/admin" muted>Open admin check</ActionLink> : null}
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
        <SectionCard eyebrow="Foundation checks" title="What this dashboard proves">
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
              <p className="mt-2 text-base font-semibold text-[color:var(--foreground)]">{user.name}</p>
            </div>
            <div className="rounded-2xl bg-[color:var(--surface-strong)] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Email</p>
              <p className="mt-2 text-base font-semibold text-[color:var(--foreground)]">{user.email}</p>
            </div>
            <div className="rounded-2xl bg-[color:rgba(15,118,110,0.08)] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Role</p>
              <p className="mt-2 text-3xl font-bold text-[color:var(--foreground)]">{user.role}</p>
            </div>
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <SectionCard eyebrow="Phase 4 now" title="What is unlocked next">
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

        <SectionCard eyebrow="Human test hint" title="Quick verification path">
          <p>
            Create one linked sale from <strong>/sales/new</strong>, then open the matching inventory product and confirm the stock dropped by the sold quantity.
          </p>
          <p className="mt-3">
            After that, create one manual sale and confirm it appears in <strong>/sales</strong> without changing inventory stock.
          </p>
        </SectionCard>
      </section>
    </main>
  );
}
