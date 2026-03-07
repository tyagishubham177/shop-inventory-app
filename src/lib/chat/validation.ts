import type {
  ChatIntent,
  ChatIntentFilters,
  ChatIntentName,
  ChatRequestedMetrics,
  ChatTimeRange,
} from "@/lib/chat/types";

type ChatValidationResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      errors: string[];
    };

const SUPPORTED_INTENTS: ChatIntentName[] = [
  "inventory_count",
  "inventory_search",
  "low_stock_list",
  "product_lookup",
  "sales_total",
  "sales_by_category",
  "sales_by_brand",
  "recent_activity_summary",
  "dashboard_summary",
  "unsupported_request",
];

const SUPPORTED_TIME_RANGES: ChatTimeRange[] = [
  "today",
  "yesterday",
  "this_week",
  "last_7_days",
  "last_week",
  "this_month",
  "last_month",
  "all_time",
];

const DEFAULT_FILTERS: ChatIntentFilters = {
  search: null,
  category: null,
  brand: null,
  productName: null,
  sku: null,
  includeArchived: false,
  lowStockOnly: false,
  timeRange: "all_time",
  dateFrom: null,
  dateTo: null,
  saleMode: "all",
  limit: 5,
};

const DEFAULT_REQUESTED_METRICS: ChatRequestedMetrics = {
  includeTotals: true,
  includeTopProduct: false,
  includeTopBrand: false,
  includeTopCategory: false,
};

function normalizeOptionalText(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  return normalized.slice(0, maxLength);
}

function normalizeBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["true", "1", "yes", "on"].includes(normalized)) {
      return true;
    }

    if (["false", "0", "no", "off"].includes(normalized)) {
      return false;
    }
  }

  return fallback;
}

function normalizeLimit(value: unknown, fallback: number) {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(parsed, 10);
}

function normalizeTimeRange(value: unknown, fallback: ChatTimeRange) {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim().toLowerCase() as ChatTimeRange;

  return SUPPORTED_TIME_RANGES.includes(normalized) ? normalized : fallback;
}

function normalizeSaleMode(value: unknown): ChatIntentFilters["saleMode"] {
  if (value === "linked" || value === "manual") {
    return value;
  }

  return "all";
}

function normalizeIsoDate(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  const exactMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (exactMatch) {
    return normalized;
  }

  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const year = parsed.getFullYear();
  const month = `${parsed.getMonth() + 1}`.padStart(2, "0");
  const day = `${parsed.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function stripMarkdownFences(value: string) {
  return value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

export function validateChatQueryInput(body: unknown): ChatValidationResult<{ question: string }> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      success: false,
      errors: ["Send a valid JSON object with a question field."],
    };
  }

  const question = normalizeOptionalText((body as Record<string, unknown>).question, 500);

  if (!question) {
    return {
      success: false,
      errors: ["Question is required."],
    };
  }

  if (question.length < 3) {
    return {
      success: false,
      errors: ["Question must be at least 3 characters long."],
    };
  }

  return {
    success: true,
    data: {
      question,
    },
  };
}

export function validateParsedChatIntent(body: unknown): ChatValidationResult<ChatIntent> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      success: false,
      errors: ["Parsed chat intent must be a JSON object."],
    };
  }

  const record = body as Record<string, unknown>;
  const intent = typeof record.intent === "string" ? (record.intent.trim().toLowerCase() as ChatIntentName) : null;

  if (!intent || !SUPPORTED_INTENTS.includes(intent)) {
    return {
      success: false,
      errors: ["Parsed chat intent is missing or unsupported."],
    };
  }

  const filtersRecord =
    record.filters && typeof record.filters === "object" && !Array.isArray(record.filters)
      ? (record.filters as Record<string, unknown>)
      : {};
  const requestedMetricsRecord =
    record.requestedMetrics && typeof record.requestedMetrics === "object" && !Array.isArray(record.requestedMetrics)
      ? (record.requestedMetrics as Record<string, unknown>)
      : {};

  return {
    success: true,
    data: {
      intent,
      filters: {
        search: normalizeOptionalText(filtersRecord.search, 120),
        category: normalizeOptionalText(filtersRecord.category, 80),
        brand: normalizeOptionalText(filtersRecord.brand, 80),
        productName: normalizeOptionalText(filtersRecord.productName, 160),
        sku: normalizeOptionalText(filtersRecord.sku, 64),
        includeArchived: normalizeBoolean(filtersRecord.includeArchived, DEFAULT_FILTERS.includeArchived),
        lowStockOnly: normalizeBoolean(filtersRecord.lowStockOnly, DEFAULT_FILTERS.lowStockOnly),
        timeRange: normalizeTimeRange(filtersRecord.timeRange, DEFAULT_FILTERS.timeRange),
        dateFrom: normalizeIsoDate(filtersRecord.dateFrom),
        dateTo: normalizeIsoDate(filtersRecord.dateTo),
        saleMode: normalizeSaleMode(filtersRecord.saleMode),
        limit: normalizeLimit(filtersRecord.limit, DEFAULT_FILTERS.limit),
      },
      requestedMetrics: {
        includeTotals: normalizeBoolean(requestedMetricsRecord.includeTotals, DEFAULT_REQUESTED_METRICS.includeTotals),
        includeTopProduct: normalizeBoolean(
          requestedMetricsRecord.includeTopProduct,
          DEFAULT_REQUESTED_METRICS.includeTopProduct,
        ),
        includeTopBrand: normalizeBoolean(
          requestedMetricsRecord.includeTopBrand,
          DEFAULT_REQUESTED_METRICS.includeTopBrand,
        ),
        includeTopCategory: normalizeBoolean(
          requestedMetricsRecord.includeTopCategory,
          DEFAULT_REQUESTED_METRICS.includeTopCategory,
        ),
      },
      clarificationNeeded: normalizeOptionalText(record.clarificationNeeded, 200),
      unsupportedReason: normalizeOptionalText(record.unsupportedReason, 200),
    },
  };
}
