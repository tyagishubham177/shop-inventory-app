"use client";

import { useState, useTransition } from "react";

import type { ChatQueryResult } from "@/lib/chat/types";

type ChatWorkspaceProps = {
  exampleQuestions: string[];
};

export function ChatWorkspace({ exampleQuestions }: ChatWorkspaceProps) {
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ChatQueryResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function submitQuestion(nextQuestion: string) {
    const normalized = nextQuestion.trim();

    if (!normalized) {
      setError("Type a question first.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/chat/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: normalized,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | ChatQueryResult
        | { error?: string; errors?: string[] }
        | null;

      if (!response.ok) {
        setError(
          payload && "errors" in payload
            ? payload.errors?.join(" ") ?? "Chat request failed."
            : payload && "error" in payload
              ? payload.error ?? "Chat request failed."
              : "Chat request failed.",
        );
        return;
      }

      startTransition(() => {
        setResult(payload as ChatQueryResult);
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Chat request failed because the network response could not be read.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const isBusy = isSubmitting || isPending;

  return (
    <div className="grid gap-4">
      <div className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]">
        <label
          htmlFor="chat-question"
          className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]"
        >
          Ask a question
        </label>
        <textarea
          id="chat-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Example: How much manual revenue came from Mar 1 to Mar 7, and which product sold most?"
          className="mt-3 min-h-32 w-full rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 text-sm text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--accent-soft)]"
        />
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-[color:var(--muted)]">
            Chat now plans read-only SQL against approved database views, retries when a query fails, and stays safely non-mutating.
          </p>
          <button
            type="button"
            onClick={() => void submitQuestion(question)}
            disabled={isBusy}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-[color:var(--primary)] px-5 py-2 text-sm font-semibold text-white shadow-[var(--shadow)] transition hover:-translate-y-0.5 hover:bg-[color:var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isBusy ? "Checking..." : "Ask chat"}
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
      </div>

      <div className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]">
          Example prompts
        </p>
        <div className="mt-4 grid gap-3">
          {exampleQuestions.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => {
                setQuestion(example);
                void submitQuestion(example);
              }}
              disabled={isBusy}
              className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 text-left text-sm font-medium text-[color:var(--foreground)] transition hover:-translate-y-0.5 hover:border-[color:var(--primary)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]">
          Answer
        </p>
        {result ? (
          <div className="mt-4 grid gap-4">
            <div className="rounded-3xl bg-[color:var(--surface-strong)] p-4 text-sm leading-7 text-[color:var(--foreground)]">
              {result.answer}
            </div>

            {result.table ? (
              <div className="overflow-hidden rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-strong)]">
                <div className="border-b border-[color:var(--border)] px-4 py-3 text-sm font-semibold text-[color:var(--foreground)]">
                  {result.table.caption}
                  {typeof result.table.rowCount === "number" ? (
                    <span className="ml-2 text-xs font-medium text-[color:var(--muted)]">
                      {result.table.truncated ? `Showing ${result.table.rows.length} of ${result.table.rowCount}+ rows` : `${result.table.rowCount} rows`}
                    </span>
                  ) : null}
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-left text-sm">
                    <thead className="bg-[color:var(--background-soft)] text-[color:var(--muted)]">
                      <tr>
                        {result.table.columns.map((column) => (
                          <th key={column} className="px-4 py-3 font-semibold">
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.table.rows.map((row, index) => (
                        <tr
                          key={`${row.join("-")}-${index}`}
                          className="border-t border-[color:var(--border)] text-[color:var(--foreground)]"
                        >
                          {row.map((cell, cellIndex) => (
                            <td key={`${cell}-${cellIndex}`} className="px-4 py-3 align-top">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {result.queryPlan ? (
              <details className="rounded-3xl border border-dashed border-[color:var(--border)] px-4 py-3 text-sm text-[color:var(--muted)]">
                <summary className="cursor-pointer font-semibold text-[color:var(--foreground)]">
                  See SQL plan and retries
                </summary>
                <div className="mt-3 grid gap-3">
                  <p className="text-xs leading-6">
                    Planner source: {result.source.intent}. Answer source: {result.source.answer}.
                  </p>
                  {result.queryPlan.summary ? (
                    <p className="rounded-2xl bg-[color:var(--surface-strong)] px-3 py-2 text-xs leading-6 text-[color:var(--foreground)]">
                      {result.queryPlan.summary}
                    </p>
                  ) : null}
                  {result.queryPlan.finalSql ? (
                    <pre className="overflow-x-auto rounded-2xl bg-slate-950 px-4 py-3 text-xs leading-6 text-slate-100">
                      {result.queryPlan.finalSql}
                    </pre>
                  ) : null}
                  <div className="grid gap-3">
                    {result.queryPlan.attempts.map((attempt, index) => (
                      <div
                        key={`${attempt.stage}-${index}`}
                        className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--primary)]">
                          Attempt {index + 1}: {attempt.stage} / {attempt.outcome}
                        </p>
                        {attempt.summary ? <p className="mt-2 text-xs leading-6 text-[color:var(--foreground)]">{attempt.summary}</p> : null}
                        <pre className="mt-2 overflow-x-auto rounded-2xl bg-slate-950 px-3 py-2 text-[11px] leading-5 text-slate-100">
                          {attempt.sql}
                        </pre>
                        <p className="mt-2 text-xs leading-6">
                          {attempt.error
                            ? `Error: ${attempt.error}`
                            : `Rows: ${attempt.rowCount ?? 0}${attempt.truncated ? "+" : ""}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </details>
            ) : result.parsedIntent ? (
              <details className="rounded-3xl border border-dashed border-[color:var(--border)] px-4 py-3 text-sm text-[color:var(--muted)]">
                <summary className="cursor-pointer font-semibold text-[color:var(--foreground)]">
                  See legacy parsed intent
                </summary>
                <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs leading-6">
                  {JSON.stringify(result.parsedIntent, null, 2)}
                </pre>
                <p className="mt-2 text-xs">
                  Intent source: {result.source.intent}. Answer source: {result.source.answer}.
                </p>
              </details>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 text-sm leading-6 text-[color:var(--muted)]">
            Start with a stock, product, sales, or activity question. Chat will stay read-only even when it plans SQL directly.
          </p>
        )}
      </div>
    </div>
  );
}