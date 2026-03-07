import type { UserSummary } from "@/lib/auth/types";
import { serverEnv } from "@/lib/env";
import { isUuidLike } from "@/lib/inventory/validation";
import { runChatQuery as runLegacyChatQuery } from "@/lib/chat/service";
import { executeChatReadOnlySql } from "@/lib/chat/sql-executor";
import { generateChatSql, repairChatSql, summarizeChatSqlResult } from "@/lib/chat/sql-openai";
import { validateGeneratedSql } from "@/lib/chat/sql-validation";
import type { ChatQueryPlan, ChatQueryResult, ChatSqlAttempt, ChatTable } from "@/lib/chat/types";

const MAX_SQL_ATTEMPTS = 3;
const MAX_RESULT_ROWS = 40;

function looksLikeWriteRequest(question: string) {
  return /\b(add|create|update|change|delete|remove|archive|restore|backup|export|reset|deduct|reduce|increase|set stock|save)\b/i.test(
    question,
  );
}

function formatCellValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? `${value}` : "-";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function buildResultTable(rows: Array<Record<string, unknown>>, rowCount: number, truncated: boolean): ChatTable | null {
  if (!rows.length) {
    return null;
  }

  const columns = Object.keys(rows[0]);

  return {
    caption: truncated ? "Query result (top rows)" : "Query result",
    columns,
    rows: rows.map((row) => columns.map((column) => formatCellValue(row[column]))),
    rowCount,
    truncated,
  };
}

function buildDeterministicAnswer(rows: Array<Record<string, unknown>>, rowCount: number, truncated: boolean) {
  if (rowCount === 0) {
    return "I could not find matching records for that question.";
  }

  if (rows.length === 1) {
    const firstRow = rows[0];
    const columns = Object.keys(firstRow);

    if (columns.length === 1) {
      return `${columns[0]}: ${formatCellValue(firstRow[columns[0]])}.`;
    }

    const preview = columns.slice(0, 3).map((column) => `${column} ${formatCellValue(firstRow[column])}`).join(", ");
    return `I found 1 matching row. ${preview}.`;
  }

  return truncated
    ? `I found more than ${rowCount - 1} matching rows. The table shows the top ${rows.length} rows.`
    : `I found ${rowCount} matching rows. The table shows the full result set.`;
}

async function insertChatLog(input: {
  user: UserSummary;
  question: string;
  execution: ChatQueryPlan | null;
  responseText: string;
  status: string;
}) {
  if (!serverEnv.supabaseUrl || !serverEnv.supabaseServiceRoleKey || !isUuidLike(input.user.id)) {
    return;
  }

  try {
    const response = await fetch(`${serverEnv.supabaseUrl}/rest/v1/chat_logs`, {
      method: "POST",
      headers: {
        apikey: serverEnv.supabaseServiceRoleKey,
        Authorization: `Bearer ${serverEnv.supabaseServiceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        user_id: input.user.id,
        original_question: input.question,
        parsed_intent_json: input.execution ?? { mode: "sql", finalSql: null, attempts: [] },
        response_text: input.responseText,
        status: input.status,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(`Chat log insert failed with status ${response.status}${detail ? `: ${detail}` : "."}`);
    }
  } catch (error) {
    console.error("Chat log insert threw an unexpected error.", error);
  }
}

function buildUnsupportedResult(answer: string): ChatQueryResult {
  return {
    status: "unsupported",
    answer,
    parsedIntent: null,
    table: null,
    source: {
      intent: "sql",
      answer: "deterministic",
    },
    queryPlan: null,
  };
}

export async function runFlexibleChatQuery(question: string, user: UserSummary): Promise<ChatQueryResult> {
  if (looksLikeWriteRequest(question)) {
    const answer = "Chat is read-only. I can inspect the current inventory, sales, and activity state, but I cannot change records from chat.";
    await insertChatLog({
      user,
      question,
      execution: null,
      responseText: answer,
      status: "unsupported",
    });
    return buildUnsupportedResult(answer);
  }

  const attempts: ChatSqlAttempt[] = [];
  let finalSql: string | null = null;
  let finalSummary: string | null = null;
  let finalRows: Array<Record<string, unknown>> = [];
  let finalRowCount = 0;
  let finalTruncated = false;
  let lastFailure = "";

  try {
    for (let attemptIndex = 0; attemptIndex < MAX_SQL_ATTEMPTS; attemptIndex += 1) {
      const stage = attemptIndex === 0 ? "generate" : "repair";
      const planned =
        stage === "generate"
          ? await generateChatSql({ question, attempts })
          : await repairChatSql({
              question,
              attempts,
              lastSql: finalSql ?? attempts[attempts.length - 1]?.sql ?? "",
              failure: lastFailure || "The previous query was not usable.",
            });

      const validation = validateGeneratedSql(planned.sql);

      if (!validation.success) {
        attempts.push({
          stage,
          sql: planned.sql,
          summary: planned.summary,
          outcome: "failed",
          error: validation.error,
          rowCount: null,
          truncated: null,
        });
        lastFailure = validation.error;
        continue;
      }

      try {
        const executed = await executeChatReadOnlySql(validation.data, MAX_RESULT_ROWS);

        attempts.push({
          stage,
          sql: validation.data,
          summary: planned.summary,
          outcome: executed.rowCount === 0 ? "empty" : "executed",
          error: null,
          rowCount: executed.rowCount,
          truncated: executed.truncated,
        });

        finalSql = validation.data;
        finalSummary = planned.summary;
        finalRows = executed.rows;
        finalRowCount = executed.rowCount;
        finalTruncated = executed.truncated;

        if (executed.rowCount > 0 || attemptIndex === MAX_SQL_ATTEMPTS - 1) {
          break;
        }

        lastFailure = "The query executed but returned no rows. Broaden the filters or use a different allowed chat_* view.";
      } catch (error) {
        const failureMessage = error instanceof Error ? error.message : "The direct SQL execution failed.";
        attempts.push({
          stage,
          sql: validation.data,
          summary: planned.summary,
          outcome: "failed",
          error: failureMessage,
          rowCount: null,
          truncated: null,
        });
        finalSql = validation.data;
        finalSummary = planned.summary;
        lastFailure = failureMessage;
      }
    }

    if (!finalSql || attempts.every((attempt) => attempt.outcome === "failed")) {
      throw new Error(lastFailure || "The direct SQL planner could not produce a valid read-only query.");
    }

    const table = buildResultTable(finalRows, finalRowCount, finalTruncated);
    let answer = buildDeterministicAnswer(finalRows, finalRowCount, finalTruncated);
    let answerSource: ChatQueryResult["source"]["answer"] = "deterministic";

    try {
      answer = await summarizeChatSqlResult({
        question,
        sql: finalSql,
        rowCount: finalRowCount,
        truncated: finalTruncated,
        rows: finalRows,
      });
      answerSource = "openai";
    } catch (error) {
      console.warn("Falling back to deterministic answer formatting for direct chat SQL.", error);
    }

    const queryPlan: ChatQueryPlan = {
      mode: "sql",
      finalSql,
      summary: finalSummary,
      attempts,
      resultPreview: finalRows.length > 0 ? JSON.stringify(finalRows.slice(0, 3), null, 2) : null,
    };

    await insertChatLog({
      user,
      question,
      execution: queryPlan,
      responseText: answer,
      status: "answered",
    });

    return {
      status: "answered",
      answer,
      parsedIntent: null,
      table,
      source: {
        intent: "sql",
        answer: answerSource,
      },
      queryPlan,
    };
  } catch (error) {
    console.warn("Falling back to the legacy intent pipeline for chat.", error);
    return runLegacyChatQuery(question, user);
  }
}