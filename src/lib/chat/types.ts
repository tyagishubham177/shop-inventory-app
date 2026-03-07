export type ChatIntentName =
  | "inventory_count"
  | "inventory_search"
  | "low_stock_list"
  | "product_lookup"
  | "sales_total"
  | "sales_by_category"
  | "sales_by_brand"
  | "recent_activity_summary"
  | "dashboard_summary"
  | "unsupported_request";

export type ChatTimeRange =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_7_days"
  | "last_week"
  | "this_month"
  | "last_month"
  | "all_time";

export type ChatIntentFilters = {
  search: string | null;
  category: string | null;
  brand: string | null;
  productName: string | null;
  sku: string | null;
  includeArchived: boolean;
  lowStockOnly: boolean;
  timeRange: ChatTimeRange;
  dateFrom: string | null;
  dateTo: string | null;
  saleMode: "all" | "linked" | "manual";
  limit: number;
};

export type ChatRequestedMetrics = {
  includeTotals: boolean;
  includeTopProduct: boolean;
  includeTopBrand: boolean;
  includeTopCategory: boolean;
};

export type ChatIntent = {
  intent: ChatIntentName;
  filters: ChatIntentFilters;
  requestedMetrics: ChatRequestedMetrics;
  clarificationNeeded: string | null;
  unsupportedReason: string | null;
};

export type ChatTable = {
  caption: string;
  columns: string[];
  rows: string[][];
  rowCount?: number;
  truncated?: boolean;
};

export type ChatSqlAttempt = {
  stage: "generate" | "repair";
  sql: string;
  summary: string | null;
  outcome: "planned" | "executed" | "empty" | "failed";
  error: string | null;
  rowCount: number | null;
  truncated: boolean | null;
};

export type ChatQueryPlan = {
  mode: "sql";
  finalSql: string | null;
  summary: string | null;
  attempts: ChatSqlAttempt[];
  resultPreview: string | null;
};

export type ChatQueryResult = {
  status: "answered" | "unsupported";
  answer: string;
  parsedIntent: ChatIntent | null;
  table: ChatTable | null;
  source: {
    intent: "openai" | "heuristic" | "sql";
    answer: "openai" | "fallback" | "deterministic";
  };
  queryPlan?: ChatQueryPlan | null;
};