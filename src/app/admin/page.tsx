import { ActionLink } from "@/components/action-link";
import { LogoutButton } from "@/components/logout-button";
import { SectionCard } from "@/components/section-card";
import { StatusPill } from "@/components/status-pill";
import { requireRole } from "@/lib/auth/current-user";

export default async function AdminPage() {
  const user = await requireRole("admin");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <section className="overflow-hidden rounded-[32px] border border-[color:var(--border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(229,246,243,0.92))] p-6 shadow-[var(--shadow)] sm:p-8">
        <StatusPill label="Admin only" />
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Admin controls are protected.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[color:var(--muted)] sm:text-lg">
          {user.name} is signed in with the <strong>{user.role}</strong> role. Staff and viewer
          accounts are redirected away from this route by both middleware and server-side role
          checks.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-[1fr_auto]">
        <SectionCard eyebrow="Phase 1 status" title="Why this page exists">
          <p>
            This placeholder gives us a safe way to verify that admin-only routes are blocked for
            non-admin users before inventory and backup actions are implemented.
          </p>
        </SectionCard>

        <div className="flex flex-col gap-3 rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]">
          <ActionLink href="/">Back to dashboard</ActionLink>
          <LogoutButton />
        </div>
      </section>
    </main>
  );
}
