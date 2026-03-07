import { ActionLink } from "@/components/action-link";
import { ChatWorkspace } from "@/components/chat/chat-workspace";
import { LogoutButton } from "@/components/logout-button";
import { SectionCard } from "@/components/section-card";
import { StatusPill } from "@/components/status-pill";
import { requireCurrentUser } from "@/lib/auth/current-user";

const EXAMPLE_QUESTIONS = [
  "Show the low-stock products right now.",
  "Find Air Runner Pro.",
  "How many T-Shirts do we have in stock?",
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
              Read-only chat for fast stock and sales questions.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[color:var(--muted)] sm:text-lg">
              Phase 6 keeps the model inside a strict intent catalog, then answers only from approved inventory, sales, and dashboard queries.
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
              <li>It can answer inventory counts, product lookups, low-stock checks, sales totals, brand and category sales breakdowns, recent activity, and dashboard summaries.</li>
              <li>It supports English, Hindi, and Hinglish phrasing, but each request is treated as a fresh question.</li>
              <li>It cannot create, update, archive, restore, export, or delete anything.</li>
            </ul>
          </SectionCard>

          <SectionCard eyebrow="Verification" title="What to check after seeding data">
            <ul className="space-y-2">
              <li>Ask one question for each supported intent and confirm the answer stays consistent with inventory and sales screens.</li>
              <li>Try an unsupported write request like changing stock and confirm the response stays safely read-only.</li>
              <li>Open the parsed intent panel and confirm the model mapped the question to the expected intent.</li>
            </ul>
          </SectionCard>
        </div>
      </section>
    </main>
  );
}


