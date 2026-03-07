import { ActionLink } from "@/components/action-link";
import { ChatWorkspace } from "@/components/chat/chat-workspace";
import { LogoutButton } from "@/components/logout-button";
import { SectionCard } from "@/components/section-card";
import { StatusPill } from "@/components/status-pill";
import { requireCurrentUser } from "@/lib/auth/current-user";

const EXAMPLE_QUESTIONS = [
  "Show the low-stock products right now.",
  "Find Air Runner Pro and show its current stock, selling price, and last updated time.",
  "How many T-Shirts do we have in stock across active products?",
  "What are total sales today?",
  "How much manual revenue came from Mar 1 to Mar 7, and which product sold most?",
  "Show recent activity on the dashboard.",
];

export default async function ChatPage() {
  const user = await requireCurrentUser();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <section className="overflow-hidden rounded-[32px] border border-[color:var(--border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(255,247,237,0.9))] p-6 shadow-[var(--shadow)] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <StatusPill label={`Signed in as ${user.role}`} />
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Read-only chat with direct SQL planning for faster, broader answers.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[color:var(--muted)] sm:text-lg">
              The chat now asks the model to generate read-only SQL against approved database views, retries with execution feedback when needed, and still blocks any write action.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <ActionLink href="/" muted>
              Open dashboard
            </ActionLink>
            <ActionLink href="/inventory" muted>
              Open inventory
            </ActionLink>
            <ActionLink href="/sales" muted>
              Open sales
            </ActionLink>
            <LogoutButton />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <ChatWorkspace exampleQuestions={EXAMPLE_QUESTIONS} />

        <div className="grid gap-4">
          <SectionCard eyebrow="Guardrails" title="What chat can and cannot do">
            <ul className="space-y-2">
              <li>It can generate flexible read-only SQL for inventory, sales, dashboard-style, and recent-activity questions.</li>
              <li>It retries when the first SQL query fails or comes back empty, and you can inspect the final SQL plus retries in the UI.</li>
              <li>It cannot create, update, archive, restore, export, or delete anything.</li>
            </ul>
          </SectionCard>

          <SectionCard eyebrow="Verification" title="What to check after running the migration">
            <ul className="space-y-2">
              <li>Ask broader aggregate questions and confirm the generated SQL still maps to the approved chat views only.</li>
              <li>Try a write request like changing stock and confirm the response clearly stays read-only.</li>
              <li>Open the SQL panel and confirm retries are visible whenever the first query needs repair.</li>
            </ul>
          </SectionCard>
        </div>
      </section>
    </main>
  );
}