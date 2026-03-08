"use client";

import { useState } from "react";

import { BACKUP_EXPORT_OPTIONS, type BackupExportType } from "@/lib/backups/types";

type BackupExportPanelProps = {
  isSupabaseConfigured: boolean;
};

type FeedbackTone = "success" | "error" | "info";

function readFileName(response: Response, exportType: BackupExportType) {
  const disposition = response.headers.get("Content-Disposition");
  const matched = disposition?.match(/filename="([^"]+)"/i);

  return matched?.[1] ?? `${exportType}.csv`;
}

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

export function BackupExportPanel({ isSupabaseConfigured }: BackupExportPanelProps) {
  const [activeExport, setActiveExport] = useState<BackupExportType | null>(null);
  const [lastCompletedExport, setLastCompletedExport] = useState<BackupExportType | null>(null);
  const [feedback, setFeedback] = useState<{ tone: FeedbackTone; text: string } | null>(null);

  async function handleExport(exportType: BackupExportType) {
    setActiveExport(exportType);
    setFeedback({ tone: "info", text: `Preparing the ${exportType} CSV export...` });
    vibrate(10);

    try {
      const response = await fetch("/api/backups/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ exportType }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string; errors?: string[] }
          | null;

        throw new Error(payload?.error ?? payload?.errors?.[0] ?? "Backup export failed.");
      }

      const blob = await response.blob();
      const fileName = readFileName(response, exportType);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      const rowCount = response.headers.get("X-Backup-Row-Count");
      setLastCompletedExport(exportType);
      setFeedback({
        tone: "success",
        text: rowCount
          ? `${fileName} downloaded with ${rowCount} rows and logged successfully.`
          : `${fileName} downloaded successfully.`,
      });
      vibrate([12, 24, 12]);
    } catch (caughtError) {
      setFeedback({
        tone: "error",
        text: caughtError instanceof Error ? caughtError.message : "Backup export failed.",
      });
      vibrate([24, 18, 24]);
    } finally {
      setActiveExport(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-dashed border-[color:var(--border)] bg-[rgba(255,255,255,0.58)] px-4 py-3 text-sm text-[color:var(--muted)]">
        {isSupabaseConfigured
          ? "Tap any export card to download a CSV and create a matching backups_log entry."
          : "Supabase env vars are missing, so export buttons stay disabled until .env.local is configured."}
      </div>

      <div className="grid gap-3">
        {BACKUP_EXPORT_OPTIONS.map((option) => {
          const isBusy = activeExport === option.type;
          const isDone = lastCompletedExport === option.type && activeExport === null;

          return (
            <div
              key={option.type}
              className={`rounded-[28px] border px-4 py-4 shadow-[var(--shadow-soft)] transition-all duration-200 ${
                isBusy
                  ? "border-emerald-200 bg-[linear-gradient(135deg,rgba(240,253,250,0.98),rgba(255,255,255,0.98))]"
                  : isDone
                    ? "border-emerald-100 bg-[linear-gradient(135deg,rgba(240,253,250,0.98),rgba(247,255,252,0.98))]"
                    : "border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,245,239,0.96))]"
              }`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`ui-badge ${isBusy ? "ui-badge-warm" : isDone ? "ui-badge-success" : "ui-badge-primary"}`}>
                      {isBusy ? "In progress" : isDone ? "Downloaded" : "Ready"}
                    </span>
                    <p className="text-lg font-semibold text-[color:var(--foreground)]">{option.label}</p>
                  </div>
                  <p className="text-sm leading-6 text-[color:var(--muted)]">{option.description}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    CSV export and backup log
                  </p>
                </div>

                <button
                  type="button"
                  disabled={!isSupabaseConfigured || activeExport !== null}
                  onClick={() => void handleExport(option.type)}
                  className={`ui-button ${isDone ? "ui-button-secondary" : "ui-button-primary"} w-full sm:w-auto sm:min-w-[168px]`}
                  aria-busy={isBusy}
                >
                  {isBusy ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                      Exporting
                    </span>
                  ) : isDone ? (
                    "Download again"
                  ) : (
                    "Export CSV"
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {feedback ? (
        <p
          className={`rounded-[24px] border px-4 py-3 text-sm ${
            feedback.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : feedback.tone === "error"
                ? "border-rose-200 bg-rose-50 text-rose-900"
                : "border-slate-200 bg-white text-slate-700"
          }`}
          aria-live="polite"
        >
          {feedback.text}
        </p>
      ) : null}
    </div>
  );
}
