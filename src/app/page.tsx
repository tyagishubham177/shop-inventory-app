import { SectionCard } from "@/components/section-card";
import { StatusPill } from "@/components/status-pill";
import { publicEnv, serverEnv } from "@/lib/env";

const checklist = [
  "Bootstrap the Next.js app with the App Router and TypeScript.",
  "Keep docs front and center so Phase 1 starts from the right constraints.",
  "Wire local-only secrets without leaking them into git history.",
];

const docsToFollow = [
  "DECISIONS.md",
  "docs/design.md",
  "docs/schema.md",
  "docs/llm-design.md",
  "docs/api-contracts.md",
  "docs/ui-spec.md",
  "TASKS.md",
  "Phase/phase0.md",
];

export default function Home() {
  const configuredSecrets = Object.values(serverEnv).filter(Boolean).length;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <section className="overflow-hidden rounded-[32px] border border-[color:var(--border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(255,247,237,0.88))] p-6 shadow-[var(--shadow)] sm:p-8">
        <div className="max-w-3xl">
          <StatusPill label="Phase 0 active" />
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Shop operations, set up for fast mobile work.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[color:var(--muted)] sm:text-lg">
            This scaffold turns the repo blueprint into a working Next.js starting point with a
            focused app shell, Tailwind styling, and environment separation for dev and prod.
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <SectionCard eyebrow="Build focus" title="What Phase 0 is doing">
          <ul className="space-y-3">
            {checklist.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-2 h-2.5 w-2.5 rounded-full bg-[color:var(--accent)]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard eyebrow="Environment" title="Config snapshot">
          <div className="grid gap-3">
            <div className="rounded-2xl bg-[color:var(--surface-strong)] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
                Public app URL
              </p>
              <p className="mt-2 text-base font-semibold text-[color:var(--foreground)]">
                {publicEnv.appUrl}
              </p>
            </div>
            <div className="rounded-2xl bg-[color:rgba(15,118,110,0.08)] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
                Server secrets detected
              </p>
              <p className="mt-2 text-3xl font-bold text-[color:var(--foreground)]">
                {configuredSecrets}/5
              </p>
            </div>
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <SectionCard eyebrow="Source of truth" title="Read these before each phase">
          <ul className="space-y-2">
            {docsToFollow.map((doc) => (
              <li key={doc} className="rounded-2xl bg-[color:var(--surface-strong)] px-4 py-3 font-medium text-[color:var(--foreground)]">
                {doc}
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard eyebrow="Next up" title="Phase 1 runway">
          <p>
            The scaffold is set up for app-managed auth, explicit server routes, and a clean
            separation between browser-safe configuration and server-only secrets.
          </p>
          <p className="mt-3">
            Once this phase is verified, we can add password hashing, session signing, middleware,
            and role-aware login flow on top of this structure.
          </p>
        </SectionCard>
      </section>
    </main>
  );
}
