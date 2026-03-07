import { serverEnv } from "@/lib/env";
import { stripMarkdownFences, validateParsedChatIntent } from "@/lib/chat/validation";

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
  const rawText = await createResponse({
    instructions: [
      "Convert the retail shop question into strict JSON for a read-only app.",
      "Supported intents only: inventory_count, inventory_search, low_stock_list, product_lookup, sales_total, sales_by_category, sales_by_brand, recent_activity_summary, dashboard_summary, unsupported_request.",
      "Return JSON only with keys: intent, filters, requestedMetrics, clarificationNeeded, unsupportedReason.",
      "filters may contain: search, category, brand, productName, sku, includeArchived, lowStockOnly, timeRange, dateFrom, dateTo, saleMode, limit.",
      "requestedMetrics may contain: includeTotals, includeTopProduct, includeTopBrand, includeTopCategory.",
      "timeRange must be one of: today, yesterday, this_week, last_7_days, last_week, this_month, last_month, all_time.",
      "dateFrom and dateTo must use YYYY-MM-DD when the user gives explicit dates or a precise date range.",
      "If the user gives explicit dates like Mar 1 to Mar 7, keep them in dateFrom and dateTo instead of collapsing to a vague week label.",
      "For combined sales questions, keep all requested metrics. Example: amount of manual sales done last week, i.e. Mar 1 to Mar 7, and which product sold most in that duration -> intent sales_total, saleMode manual, dateFrom 2026-03-01, dateTo 2026-03-07, requestedMetrics includeTotals true and includeTopProduct true.",
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

  return parsed.data;
}
