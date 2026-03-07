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
            This chat is stateless and read-only. It handles exact date ranges, manual or linked sales filters, and inventory or dashboard questions.
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

            <details className="rounded-3xl border border-dashed border-[color:var(--border)] px-4 py-3 text-sm text-[color:var(--muted)]">
              <summary className="cursor-pointer font-semibold text-[color:var(--foreground)]">
                See parsed intent
              </summary>
              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs leading-6">
                {JSON.stringify(result.parsedIntent, null, 2)}
              </pre>
              <p className="mt-2 text-xs">
                Intent source: {result.source.intent}. Answer source: {result.source.answer}.
              </p>
            </details>
          </div>
        ) : (
          <p className="mt-4 text-sm leading-6 text-[color:var(--muted)]">
            Start with a stock, product, sales, or dashboard question. Unsupported requests will stay safely read-only.
          </p>
        )}
      </div>
    </div>
  );
}

