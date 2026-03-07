import { serverEnv } from "@/lib/env";
import { stripMarkdownFences, validateParsedChatIntent } from "@/lib/chat/validation";
import type { ChatIntent } from "@/lib/chat/types";

type OpenAiResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const MONTH_INDEX: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

function assertOpenAiConfig() {
  if (!serverEnv.openAiApiKey) {
    throw new Error("OPENAI_API_KEY is required before the chat workspace can call OpenAI.");
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

function parseMonthDay(monthLabel: string, dayLabel: string, year: number) {
  const monthIndex = MONTH_INDEX[monthLabel.toLowerCase()];
  const day = Number.parseInt(dayLabel, 10);

  if (monthIndex === undefined || !Number.isInteger(day) || day < 1 || day > 31) {
    return null;
  }

  return formatDateInput(new Date(year, monthIndex, day));
}

function normalizeYearlessDateRange(question: string, parsedIntent: ChatIntent) {
  if (!parsedIntent.filters.dateFrom && !parsedIntent.filters.dateTo) {
    return parsedIntent;
  }

  if (/\b\d{4}\b/.test(question)) {
    return parsedIntent;
  }

  const monthRangeMatch = question.match(
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?\s*(?:to|-|through|until|and)\s*(?:(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+)?(\d{1,2})(?:st|nd|rd|th)?\b/i,
  );

  if (!monthRangeMatch) {
    return parsedIntent;
  }

  const { currentYear } = buildCurrentDateContext();
  const firstMonth = monthRangeMatch[1];
  const firstDay = monthRangeMatch[2];
  const secondMonth = monthRangeMatch[3] ?? firstMonth;
  const secondDay = monthRangeMatch[4];
  const dateFrom = parseMonthDay(firstMonth, firstDay, currentYear);
  const dateTo = parseMonthDay(secondMonth, secondDay, currentYear);

  if (!dateFrom || !dateTo) {
    return parsedIntent;
  }

  return {
    ...parsedIntent,
    filters: {
      ...parsedIntent.filters,
      dateFrom,
      dateTo,
    },
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

export async function parseIntentWithOpenAi(question: string) {
  const currentDateContext = buildCurrentDateContext();
  const rawText = await createResponse({
    instructions: [
      "Convert the retail shop question into strict JSON for a read-only app.",
      `Today is ${currentDateContext.todayIso}. The current year is ${currentDateContext.currentYear}.`,
      "Supported intents only: inventory_count, inventory_search, low_stock_list, product_lookup, sales_total, sales_by_category, sales_by_brand, recent_activity_summary, dashboard_summary, unsupported_request.",
      "Return JSON only with keys: intent, filters, requestedMetrics, clarificationNeeded, unsupportedReason.",
      "filters may contain: search, category, brand, productName, sku, includeArchived, lowStockOnly, timeRange, dateFrom, dateTo, saleMode, limit.",
      "requestedMetrics may contain: includeTotals, includeTopProduct, includeTopBrand, includeTopCategory.",
      "timeRange must be one of: today, yesterday, this_week, last_7_days, last_week, this_month, last_month, all_time.",
      "dateFrom and dateTo must use YYYY-MM-DD when the user gives explicit dates or a precise date range.",
      "If the user gives month-day dates without a year, assume the current year unless the question explicitly says another year.",
      "If the date is still ambiguous after using current date context, return unsupported_request with clarificationNeeded instead of guessing a distant year.",
      "If the user gives explicit dates like Mar 1 to Mar 7, keep them in dateFrom and dateTo instead of collapsing to a vague week label.",
      `Example: amount of manual sales done from Mar 1 to Mar 7, and which product sold most in that duration -> intent sales_total, saleMode manual, dateFrom ${currentDateContext.currentYear}-03-01, dateTo ${currentDateContext.currentYear}-03-07, requestedMetrics includeTotals true and includeTopProduct true.`,
      "Example: which brand sold the most in the last 7 days -> intent sales_by_brand, timeRange last_7_days, requestedMetrics includeTopBrand true.",
      "Example: show low-stock shoes -> intent low_stock_list, category Shoes, lowStockOnly true.",
      "Map write requests, backup or export requests, user-management requests, auth requests, and unclear follow-up questions to unsupported_request.",
      "Support English, Hindi, and Hinglish retail phrasing.",
      "Never output SQL, prose, or markdown fences around the JSON.",
    ].join(" "),
    input: question,
    maxOutputTokens: 320,
  });

  const parsed = validateParsedChatIntent(JSON.parse(stripMarkdownFences(rawText)));

  if (!parsed.success) {
    throw new Error(parsed.errors.join(" "));
  }

  return normalizeYearlessDateRange(question, parsed.data);
}