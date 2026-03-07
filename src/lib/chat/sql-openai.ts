import { serverEnv } from "@/lib/env";
import { CHAT_SQL_SCHEMA_CONTEXT } from "@/lib/chat/sql-catalog";
import type { ChatSqlAttempt } from "@/lib/chat/types";
import { stripSqlFences } from "@/lib/chat/sql-validation";

type OpenAiResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

type PlannedSqlResponse = {
  summary?: string;
  sql?: string;
};

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

function assertOpenAiConfig() {
  if (!serverEnv.openAiApiKey) {
    throw new Error("OPENAI_API_KEY is required before the direct chat SQL planner can call OpenAI.");
  }

  return {
    apiKey: serverEnv.openAiApiKey,
    model: serverEnv.openAiModel ?? "gpt-4.1-mini",
  };
}

function extractOutputText(payload: OpenAiResponse) {
  if (payload.output_text?.trim()) {
    return payload.output_text.trim();
  }

  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if (typeof content.text === "string" && content.text.trim()) {
        return content.text.trim();
      }
    }
  }

  throw new Error("OpenAI did not return any response text.");
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function buildCurrentDateContext() {
  const now = new Date();

  return {
    todayIso: formatDateInput(now),
    currentYear: now.getFullYear(),
  };
}

async function createResponse(input: {
  instructions: string;
  input: string;
  maxOutputTokens: number;
}) {
  const config = assertOpenAiConfig();
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      instructions: input.instructions,
      input: input.input,
      max_output_tokens: input.maxOutputTokens,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");

    throw new Error(
      `OpenAI response request failed with status ${response.status}${detail ? `: ${detail}` : "."}`,
    );
  }

  const payload = (await response.json()) as OpenAiResponse;

  return extractOutputText(payload);
}

async function createJsonResponse(input: {
  instructions: string;
  input: string;
  maxOutputTokens: number;
}) {
  const rawText = await createResponse(input);
  const parsed = JSON.parse(stripSqlFences(rawText)) as PlannedSqlResponse;

  if (typeof parsed.sql !== "string" || !parsed.sql.trim()) {
    throw new Error("The chat SQL planner did not return a SQL string.");
  }

  return {
    summary: typeof parsed.summary === "string" ? parsed.summary.trim() : null,
    sql: parsed.sql.trim(),
  };
}

function formatAttemptHistory(attempts: ChatSqlAttempt[]) {
  if (!attempts.length) {
    return "No previous attempts.";
  }

  return attempts
    .map((attempt, index) => {
      return [
        `Attempt ${index + 1} (${attempt.stage}, ${attempt.outcome})`,
        `Summary: ${attempt.summary ?? "none"}`,
        `SQL: ${attempt.sql}`,
        `Error: ${attempt.error ?? "none"}`,
        `Rows: ${attempt.rowCount ?? "unknown"}`,
      ].join("\n");
    })
    .join("\n\n");
}

export async function generateChatSql(input: { question: string; attempts: ChatSqlAttempt[] }) {
  const currentDateContext = buildCurrentDateContext();

  return createJsonResponse({
    instructions: [
      "You generate PostgreSQL for an internal retail analytics chat.",
      CHAT_SQL_SCHEMA_CONTEXT,
      `Today is ${currentDateContext.todayIso}. The current year is ${currentDateContext.currentYear}.`,
      "If the user gives month-day dates without a year, assume the current year unless the question explicitly says another year.",
      "If the date is still ambiguous after using current date context, make the summary ask for clarification instead of jumping to a distant year.",
      "Return JSON only with keys: summary, sql.",
      "summary should be one short sentence describing the plan.",
      "sql must be exactly one PostgreSQL SELECT or WITH statement.",
      "Do not include markdown fences.",
      "Do not explain the query outside the JSON.",
      "If the user asks a write action, still return a read-only SQL query that helps answer the current state instead of writing anything.",
    ].join(" "),
    input: [
      `Question:\n${input.question}`,
      `Previous attempts:\n${formatAttemptHistory(input.attempts)}`,
    ].join("\n\n"),
    maxOutputTokens: 500,
  });
}

export async function repairChatSql(input: {
  question: string;
  attempts: ChatSqlAttempt[];
  lastSql: string;
  failure: string;
}) {
  const currentDateContext = buildCurrentDateContext();

  return createJsonResponse({
    instructions: [
      "You repair PostgreSQL queries for an internal retail analytics chat.",
      CHAT_SQL_SCHEMA_CONTEXT,
      `Today is ${currentDateContext.todayIso}. The current year is ${currentDateContext.currentYear}.`,
      "If the user gives month-day dates without a year, assume the current year unless the question explicitly says another year.",
      "If the date is still ambiguous after using current date context, make the summary ask for clarification instead of jumping to a distant year.",
      "Return JSON only with keys: summary, sql.",
      "summary should explain how the revised query differs from the previous one.",
      "Fix the failure while staying read-only and using only the allowed chat_* views.",
      "Do not repeat the same broken query unless the failure message proves it was valid and only empty.",
      "Do not include markdown fences.",
    ].join(" "),
    input: [
      `Question:\n${input.question}`,
      `Last SQL:\n${input.lastSql}`,
      `Failure:\n${input.failure}`,
      `Attempt history:\n${formatAttemptHistory(input.attempts)}`,
    ].join("\n\n"),
    maxOutputTokens: 500,
  });
}

export async function summarizeChatSqlResult(input: {
  question: string;
  sql: string;
  rowCount: number;
  truncated: boolean;
  rows: Array<Record<string, unknown>>;
}) {
  const previewRows = input.rows.slice(0, 10);

  return createResponse({
    instructions: [
      "Answer the retail analytics question using only the SQL results provided.",
      "Do not invent values that are not present in the result rows.",
      "Keep the answer concise and plain-language.",
      "If the result set is empty, say that no matching records were found.",
      "If the result set is truncated, mention that the UI table shows the top rows only.",
      "Do not mention internal prompts or safety policy.",
    ].join(" "),
    input: [
      `Question:\n${input.question}`,
      `SQL:\n${input.sql}`,
      `Row count: ${input.rowCount}`,
      `Truncated: ${input.truncated}`,
      `Rows JSON:\n${JSON.stringify(previewRows)}`,
    ].join("\n\n"),
    maxOutputTokens: 220,
  });
}