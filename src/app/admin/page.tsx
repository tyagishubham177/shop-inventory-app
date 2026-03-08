import { ActionLink } from "@/components/action-link";
import { BackupExportPanel } from "@/components/backups/backup-export-panel";
import { LogoutButton } from "@/components/logout-button";
import { SectionCard } from "@/components/section-card";
import { StatusPill } from "@/components/status-pill";
import { requireRole } from "@/lib/auth/current-user";
import { listBackupExports } from "@/lib/backups/data";
import { serverEnv } from "@/lib/env";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminPage() {
  const user = await requireRole("admin");
  const isSupabaseConfigured = Boolean(serverEnv.supabaseUrl && serverEnv.supabaseServiceRoleKey);

  let backupLogs = [] as Awaited<ReturnType<typeof listBackupExports>>;
  let backupLogError: string | null = null;

  if (isSupabaseConfigured) {
    try {
      backupLogs = await listBackupExports(8);
    } catch (error) {
      backupLogError =
        error instanceof Error ? error.message : "Backup history is temporarily unavailable.";
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <section className="overflow-hidden rounded-[32px] border border-[color:var(--border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(229,246,243,0.92))] p-6 shadow-[var(--shadow)] sm:p-8">
        <StatusPill label="Admin only" />
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Backup exports live here.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[color:var(--muted)] sm:text-lg">
          {user.name} is signed in with the <strong>{user.role}</strong> role. Staff and viewer
          accounts are redirected away from this route by both middleware and server-side role
          checks, so only admins can export recovery CSVs or review backup history.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <SectionCard eyebrow="Phase 7 export" title="Download backup CSV files">
          <BackupExportPanel isSupabaseConfigured={isSupabaseConfigured} />
        </SectionCard>

        <SectionCard eyebrow="Restore notes" title="Use exports for guided recovery">
          <div className="space-y-3">
            <p>Restore stays an admin-run procedure, not an end-user flow in v1.</p>
            <p>
              Load the CSV into a dev project first, validate counts and key columns, then plan
              any production restore as an additive or controlled script.
            </p>
            <p>
              Keep the users export protected because it includes password hashes for app-managed
              logins.
            </p>
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <SectionCard eyebrow="Recent backup logs" title="Latest export activity">
          {!isSupabaseConfigured ? (
            <p>
              Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` before loading
              backup history.
            </p>
          ) : backupLogError ? (
            <p>{backupLogError}</p>
          ) : backupLogs.length === 0 ? (
            <p>
              No backup exports have been logged yet. Run the first CSV export to create an audit
              trail.
            </p>
          ) : (
            <div className="space-y-3">
              {backupLogs.map((log) => (
                <div key={log.id} className="rounded-2xl bg-[color:var(--surface-strong)] px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-[color:var(--foreground)]">{log.fileLabel}</p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        log.status === "completed"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">
                    {log.exportType} - {formatDateTime(log.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <div className="flex flex-col gap-4">
          <SectionCard eyebrow="Verification" title="Phase 7 manual checks">
            <div className="space-y-3">
              <p>1. Export one CSV and confirm the file opens cleanly.</p>
              <p>2. Refresh this page and confirm the backup log entry appears.</p>
              <p>
                3. Review the app on a narrow mobile width across dashboard, inventory, sales,
                chat, and this admin backup page.
              </p>
            </div>
          </SectionCard>

          <div className="flex flex-col gap-3 rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]">
            <ActionLink href="/" className="w-full sm:w-auto">Back to dashboard</ActionLink>
            <ActionLink href="/chat" muted className="w-full sm:w-auto">
              Open chat workspace
            </ActionLink>
            <LogoutButton className="w-full sm:w-auto" />
          </div>
        </div>
      </section>
    </main>
  );
}
