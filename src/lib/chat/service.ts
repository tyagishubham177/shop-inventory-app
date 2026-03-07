import type { UserSummary } from "@/lib/auth/types";
import { getDashboardData } from "@/lib/dashboard/data";
import { serverEnv } from "@/lib/env";
import { getInventoryCategories, getInventoryProductDetail, listInventoryProducts } from "@/lib/inventory/data";
import type { InventoryProduct } from "@/lib/inventory/types";
import { isUuidLike } from "@/lib/inventory/validation";
import { listSalesEntries } from "@/lib/sales/data";
import { parseIntentWithOpenAi } from "@/lib/chat/openai";
import type { ChatIntent, ChatQueryResult, ChatRequestedMetrics, ChatTable, ChatTimeRange } from "@/lib/chat/types";

const CATEGORY_ALIASES: Record<string, string> = {
  accessory: "Accessories",
  accessories: "Accessories",
  jacket: "Jackets",
  jackets: "Jackets",
  jean: "Jeans",
  jeans: "Jeans",
  lower: "Lowers",
  lowers: "Lowers",
  "track pant": "Lowers",
  "track pants": "Lowers",
  shirt: "Shirts",
  shirts: "Shirts",
  shoe: "Shoes",
  shoes: "Shoes",
  sneaker: "Shoes",
  sneakers: "Shoes",
  tee: "T-Shirts",
  tees: "T-Shirts",
  tshirt: "T-Shirts",
  "t shirt": "T-Shirts",
  "t shirts": "T-Shirts",
  "t-shirt": "T-Shirts",
  "t-shirts": "T-Shirts",
};

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

type ExecutedChatQuery = {
  status: "answered" | "unsupported";
  table: ChatTable | null;
  queryData: Record<string, unknown>;
  fallbackAnswer: string;
};

type SalesAggregateRow = {
  key: string;
  quantity: number;
  revenue: number;
  count: number;
};

function normalizeComparableText(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatPercent(current: number, previous: number) {
  if (current === 0 && previous === 0) {
    return "flat";
  }

  if (previous === 0) {
    return "up sharply";
  }

  const change = ((current - previous) / previous) * 100;

  return `${Math.abs(change).toFixed(0)}% ${change >= 0 ? "up" : "down"}`;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function buildDateLabel(dateFrom: string, dateTo: string) {
  if (dateFrom === dateTo) {
    return formatDate(dateFrom);
  }

  return `${formatDate(dateFrom)} to ${formatDate(dateTo)}`;
}

function getDateRange(timeRange: ChatTimeRange) {
  const now = new Date();
  const today = startOfDay(now);

  switch (timeRange) {
    case "today":
      return {
        label: "today",
        dateFrom: formatDateInput(today),
        dateTo: formatDateInput(today),
      };
    case "yesterday": {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      return {
        label: "yesterday",
        dateFrom: formatDateInput(yesterday),
        dateTo: formatDateInput(yesterday),
      };
    }
    case "this_week": {
      const start = new Date(today);
      const offset = (start.getDay() + 6) % 7;
      start.setDate(start.getDate() - offset);

      return {
        label: "this week",
        dateFrom: formatDateInput(start),
        dateTo: formatDateInput(now),
      };
    }
    case "last_7_days": {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);

      return {
        label: "the last 7 days",
        dateFrom: formatDateInput(start),
        dateTo: formatDateInput(now),
      };
    }
    case "last_week": {
      const end = new Date(today);
      const offset = (end.getDay() + 6) % 7;
      end.setDate(end.getDate() - offset - 1);
      const start = new Date(end);
      start.setDate(start.getDate() - 6);

      return {
        label: "last week",
        dateFrom: formatDateInput(start),
        dateTo: formatDateInput(end),
      };
    }
    case "this_month": {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);

      return {
        label: "this month",
        dateFrom: formatDateInput(start),
        dateTo: formatDateInput(now),
      };
    }
    case "last_month": {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);

      return {
        label: "last month",
        dateFrom: formatDateInput(start),
        dateTo: formatDateInput(end),
      };
    }
    case "all_time":
    default:
      return {
        label: "all time",
        dateFrom: "",
        dateTo: "",
      };
  }
}

function getDateRangeFromFilters(filters: ChatIntent["filters"]) {
  if (filters.dateFrom || filters.dateTo) {
    const dateFrom = filters.dateFrom ?? filters.dateTo ?? "";
    const dateTo = filters.dateTo ?? filters.dateFrom ?? "";

    return {
      label: buildDateLabel(dateFrom, dateTo),
      dateFrom,
      dateTo,
    };
  }

  return getDateRange(filters.timeRange);
}

function detectTimeRange(question: string): ChatTimeRange {
  const normalized = question.toLowerCase();

  if (normalized.includes("last 7 days")) {
    return "last_7_days";
  }

  if (normalized.includes("today") || normalized.includes("aaj")) {
    return "today";
  }

  if (normalized.includes("yesterday") || normalized.includes("kal")) {
    return "yesterday";
  }

  if (normalized.includes("this week") || normalized.includes("is hafte")) {
    return "this_week";
  }

  if (normalized.includes("last week") || normalized.includes("pichle hafte")) {
    return "last_week";
  }

  if (normalized.includes("this month") || normalized.includes("is mahine")) {
    return "this_month";
  }

  if (normalized.includes("last month") || normalized.includes("pichle mahine")) {
    return "last_month";
  }

  return "all_time";
}

function detectCategory(question: string) {
  const normalized = normalizeComparableText(question);

  for (const [alias, category] of Object.entries(CATEGORY_ALIASES)) {
    if (normalized.includes(alias)) {
      return category;
    }
  }

  return null;
}

function detectSku(question: string) {
  const match = question.match(/\b[A-Z]{2,}(?:-[A-Z0-9]{2,})+\b/);

  return match?.[0] ?? null;
}

function detectSearchTerm(question: string) {
  const normalized = question
    .replace(/\b(show|find|search|lookup|open|what|which|how many|kitne|kitna|batao|please|products|product|items|item)\b/gi, " ")
    .replace(/\b(in stock|stock|sales|sale|today|yesterday|this week|last week|this month|last month|right now)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized.length >= 3 ? normalized : null;
}

function parseMonthDay(monthLabel: string, dayLabel: string, year: number) {
  const monthIndex = MONTH_INDEX[monthLabel.toLowerCase()];
  const day = Number.parseInt(dayLabel, 10);

  if (monthIndex === undefined || !Number.isInteger(day) || day < 1 || day > 31) {
    return null;
  }

  return formatDateInput(new Date(year, monthIndex, day));
}

function detectExplicitDateRange(question: string) {
  const isoRangeMatch = question.match(/(\d{4}-\d{2}-\d{2})\s*(?:to|-|through|until|and)\s*(\d{4}-\d{2}-\d{2})/i);

  if (isoRangeMatch) {
    return {
      dateFrom: isoRangeMatch[1],
      dateTo: isoRangeMatch[2],
    };
  }

  const monthRangeMatch = question.match(
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?\s*(?:to|-|through|until|and)\s*(?:(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+)?(\d{1,2})(?:st|nd|rd|th)?\b/i,
  );

  if (monthRangeMatch) {
    const currentYear = new Date().getFullYear();
    const firstMonth = monthRangeMatch[1];
    const firstDay = monthRangeMatch[2];
    const secondMonth = monthRangeMatch[3] ?? firstMonth;
    const secondDay = monthRangeMatch[4];
    const dateFrom = parseMonthDay(firstMonth, firstDay, currentYear);
    const dateTo = parseMonthDay(secondMonth, secondDay, currentYear);

    if (dateFrom && dateTo) {
      return { dateFrom, dateTo };
    }
  }

  return {
    dateFrom: null,
    dateTo: null,
  };
}

function detectRequestedMetrics(question: string): ChatRequestedMetrics {
  const normalized = question.toLowerCase();

  return {
    includeTotals:
      /\b(total|amount|revenue|sales|how much|kitni|kitna)\b/i.test(question) ||
      normalized.includes("manual sales") ||
      normalized.includes("linked sales"),
    includeTopProduct:
      normalized.includes("top product") ||
      normalized.includes("which product sold most") ||
      normalized.includes("most sold product") ||
      /kaunsa product.*sabse zyada/i.test(question),
    includeTopBrand:
      normalized.includes("top brand") ||
      normalized.includes("which brand sold most") ||
      normalized.includes("most sold brand") ||
      /kaunsi brand.*sabse zyada/i.test(question),
    includeTopCategory:
      normalized.includes("top category") ||
      normalized.includes("which category sold most") ||
      normalized.includes("most sold category") ||
      /kaunsi category.*sabse zyada/i.test(question),
  };
}

function buildHeuristicIntent(question: string): ChatIntent {
  const normalized = question.toLowerCase();
  const isWriteRequest =
    /\b(add|create|update|change|delete|remove|archive|restore|export|backup|reset)\b/i.test(question) ||
    /\b(jodo|badlo|delete karo|hatao)\b/i.test(question);
  const category = detectCategory(question);
  const sku = detectSku(question);
  const search = detectSearchTerm(question);
  const timeRange = detectTimeRange(question);
  const explicitDateRange = detectExplicitDateRange(question);
  const requestedMetrics = detectRequestedMetrics(question);

  const baseFilters = {
    search,
    category,
    brand: null,
    productName: search,
    sku,
    includeArchived: normalized.includes("archived"),
    lowStockOnly: normalized.includes("low stock") || normalized.includes("kam stock"),
    timeRange,
    dateFrom: explicitDateRange.dateFrom,
    dateTo: explicitDateRange.dateTo,
    saleMode: normalized.includes("manual") ? "manual" : normalized.includes("linked") ? "linked" : "all",
    limit: 5,
  } as const;

  if (isWriteRequest) {
    return {
      intent: "unsupported_request",
      filters: baseFilters,
      requestedMetrics,
      clarificationNeeded: null,
      unsupportedReason: "Chat is read-only and cannot change inventory, sales, users, or backups.",
    };
  }

  if (normalized.includes("dashboard") || normalized.includes("summary")) {
    return {
      intent: "dashboard_summary",
      filters: baseFilters,
      requestedMetrics,
      clarificationNeeded: null,
      unsupportedReason: null,
    };
  }

  if (normalized.includes("recent activity") || normalized.includes("recent changes") || normalized.includes("kya change")) {
    return {
      intent: "recent_activity_summary",
      filters: baseFilters,
      requestedMetrics,
      clarificationNeeded: null,
      unsupportedReason: null,
    };
  }

  if (normalized.includes("low stock") || normalized.includes("kam stock") || normalized.includes("reorder")) {
    return {
      intent: "low_stock_list",
      filters: baseFilters,
      requestedMetrics,
      clarificationNeeded: null,
      unsupportedReason: null,
    };
  }

  if (
    normalized.includes("sales by brand") ||
    (normalized.includes("brand") &&
      (normalized.includes("sold") || normalized.includes("biki") || normalized.includes("bike")))
  ) {
    return {
      intent: "sales_by_brand",
      filters: baseFilters,
      requestedMetrics: {
        ...requestedMetrics,
        includeTopBrand: true,
      },
      clarificationNeeded: null,
      unsupportedReason: null,
    };
  }

  if (
    normalized.includes("sales by category") ||
    (normalized.includes("category") &&
      (normalized.includes("sold") || normalized.includes("biki") || normalized.includes("bike")))
  ) {
    return {
      intent: "sales_by_category",
      filters: baseFilters,
      requestedMetrics: {
        ...requestedMetrics,
        includeTopCategory: true,
      },
      clarificationNeeded: null,
      unsupportedReason: null,
    };
  }

  if (
    normalized.includes("sales total") ||
    normalized.includes("total sales") ||
    normalized.includes("revenue") ||
    normalized.includes("bikri") ||
    normalized.includes("manual sales") ||
    normalized.includes("linked sales") ||
    requestedMetrics.includeTopProduct
  ) {
    return {
      intent: "sales_total",
      filters: baseFilters,
      requestedMetrics: {
        ...requestedMetrics,
        includeTotals: true,
      },
      clarificationNeeded: null,
      unsupportedReason: null,
    };
  }

  if (
    normalized.includes("how many") ||
    normalized.includes("count") ||
    normalized.includes("kitne") ||
    normalized.includes("kitna stock")
  ) {
    return {
      intent: "inventory_count",
      filters: baseFilters,
      requestedMetrics,
      clarificationNeeded: null,
      unsupportedReason: null,
    };
  }

  if (sku || normalized.includes("price") || normalized.includes("sku") || normalized.includes("product")) {
    return {
      intent: "product_lookup",
      filters: baseFilters,
      requestedMetrics,
      clarificationNeeded: search ? null : "Please mention the product name or SKU you want to inspect.",
      unsupportedReason: null,
    };
  }

  if (normalized.includes("show") || normalized.includes("find") || normalized.includes("search")) {
    return {
      intent: "inventory_search",
      filters: baseFilters,
      requestedMetrics,
      clarificationNeeded: null,
      unsupportedReason: null,
    };
  }

  return {
    intent: "unsupported_request",
    filters: baseFilters,
    requestedMetrics,
    clarificationNeeded: "Please restate the question with a product, sales range, or dashboard request.",
    unsupportedReason: "That request does not fit the supported Phase 6 chat intents.",
  };
}

async function resolveCategoryId(category: string | null) {
  if (!category) {
    return "";
  }

  const categories = await getInventoryCategories();
  const normalizedTarget = normalizeComparableText(category);
  const match = categories.find((item) => {
    const normalizedName = normalizeComparableText(item.name);
    const normalizedSlug = normalizeComparableText(item.slug);

    return (
      normalizedName === normalizedTarget ||
      normalizedSlug === normalizedTarget ||
      normalizedName.includes(normalizedTarget) ||
      normalizedSlug.includes(normalizedTarget)
    );
  });

  return match?.id ?? "";
}

async function getInventoryMatches(parsedIntent: ChatIntent) {
  const categoryId = await resolveCategoryId(parsedIntent.filters.category);
  const searchTerm =
    parsedIntent.filters.sku ??
    parsedIntent.filters.productName ??
    parsedIntent.filters.search ??
    parsedIntent.filters.category ??
    "";

  return listInventoryProducts({
    query: searchTerm,
    categoryId,
    brand: parsedIntent.filters.brand ?? "",
    archived: parsedIntent.filters.includeArchived ? "all" : "active",
    lowStock: parsedIntent.filters.lowStockOnly || parsedIntent.intent === "low_stock_list",
    page: 1,
    pageSize: 50,
  });
}

function scoreProductMatch(product: InventoryProduct, parsedIntent: ChatIntent) {
  let score = 0;
  const sku = normalizeComparableText(parsedIntent.filters.sku);
  const productName = normalizeComparableText(parsedIntent.filters.productName ?? parsedIntent.filters.search);
  const brand = normalizeComparableText(parsedIntent.filters.brand);
  const category = normalizeComparableText(parsedIntent.filters.category);
  const productSku = normalizeComparableText(product.sku);
  const productNameValue = normalizeComparableText(product.name);
  const productBrand = normalizeComparableText(product.brand);
  const productCategory = normalizeComparableText(product.categoryName);

  if (sku && productSku === sku) {
    score += 120;
  } else if (sku && productSku.includes(sku)) {
    score += 80;
  }

  if (productName && productNameValue === productName) {
    score += 100;
  } else if (productName && productNameValue.includes(productName)) {
    score += 70;
  }

  if (brand && productBrand === brand) {
    score += 20;
  }

  if (category && productCategory === category) {
    score += 15;
  }

  if (!product.isArchived) {
    score += 5;
  }

  return score;
}

function createInventoryTable(caption: string, items: InventoryProduct[], limit: number): ChatTable | null {
  if (!items.length) {
    return null;
  }

  return {
    caption,
    columns: ["Product", "SKU", "Category", "Brand", "Stock"],
    rows: items.slice(0, limit).map((item) => [
      item.name,
      item.sku,
      item.categoryName,
      item.brand ?? "-",
      `${item.currentStock}`,
    ]),
  };
}

function aggregateSalesRows(
  items: Array<{
    productNameSnapshot: string;
    categoryNameSnapshot: string | null;
    brandSnapshot: string | null;
    quantity: number;
    lineTotal: number;
  }>,
  selector: (item: {
    productNameSnapshot: string;
    categoryNameSnapshot: string | null;
    brandSnapshot: string | null;
    quantity: number;
    lineTotal: number;
  }) => string,
) {
  const grouped = new Map<string, { quantity: number; revenue: number; count: number }>();

  for (const item of items) {
    const key = selector(item);
    const existing = grouped.get(key) ?? { quantity: 0, revenue: 0, count: 0 };
    grouped.set(key, {
      quantity: existing.quantity + item.quantity,
      revenue: existing.revenue + item.lineTotal,
      count: existing.count + 1,
    });
  }

  return [...grouped.entries()]
    .map(([key, value]) => ({
      key,
      quantity: value.quantity,
      revenue: value.revenue,
      count: value.count,
    }))
    .sort((left, right) => {
      if (right.revenue !== left.revenue) {
        return right.revenue - left.revenue;
      }

      if (right.quantity !== left.quantity) {
        return right.quantity - left.quantity;
      }

      return left.key.localeCompare(right.key);
    });
}

function aggregateSalesTable(
  rows: SalesAggregateRow[],
  caption: string,
  firstColumnLabel: string,
  limit: number,
): ChatTable | null {
  if (!rows.length) {
    return null;
  }

  return {
    caption,
    columns: [firstColumnLabel, "Revenue", "Units", "Lines"],
    rows: rows.slice(0, limit).map((row) => [
      row.key,
      formatCurrency(row.revenue),
      `${row.quantity}`,
      `${row.count}`,
    ]),
  };
}

async function executeInventoryCount(parsedIntent: ChatIntent): Promise<ExecutedChatQuery> {
  const result = await getInventoryMatches(parsedIntent);
  const totalUnits = result.items.reduce((sum, item) => sum + item.currentStock, 0);
  const label = parsedIntent.filters.category ?? parsedIntent.filters.brand ?? "matching";

  return {
    status: "answered",
    table: null,
    queryData: {
      itemCount: result.items.length,
      totalUnits,
      filters: parsedIntent.filters,
    },
    fallbackAnswer:
      result.items.length > 0
        ? `I found ${result.items.length} ${label} products with ${totalUnits} units currently in stock.`
        : "I could not find any inventory records that match that question.",
  };
}

async function executeInventorySearch(parsedIntent: ChatIntent): Promise<ExecutedChatQuery> {
  const result = await getInventoryMatches(parsedIntent);
  const limit = parsedIntent.filters.limit;

  return {
    status: "answered",
    table: createInventoryTable("Matching inventory products", result.items, limit),
    queryData: {
      itemCount: result.items.length,
      items: result.items.slice(0, limit),
      filters: parsedIntent.filters,
    },
    fallbackAnswer:
      result.items.length > 0
        ? `I found ${result.items.length} matching products. The top result is ${result.items[0]?.name ?? "the first match"}.`
        : "I could not find any products that match those filters.",
  };
}

async function executeLowStockList(parsedIntent: ChatIntent): Promise<ExecutedChatQuery> {
  const result = await getInventoryMatches({
    ...parsedIntent,
    filters: {
      ...parsedIntent.filters,
      lowStockOnly: true,
    },
  });
  const limit = parsedIntent.filters.limit;

  return {
    status: "answered",
    table: {
      caption: "Low-stock products",
      columns: ["Product", "SKU", "Category", "Stock", "Reorder"],
      rows: result.items.slice(0, limit).map((item) => [
        item.name,
        item.sku,
        item.categoryName,
        `${item.currentStock}`,
        `${item.reorderLevel}`,
      ]),
    },
    queryData: {
      itemCount: result.items.length,
      items: result.items.slice(0, limit),
      filters: parsedIntent.filters,
    },
    fallbackAnswer:
      result.items.length > 0
        ? `${result.items.length} products are at or below reorder level. The most urgent is ${result.items[0]?.name ?? "the first item"}.`
        : "No active products are currently below their reorder level.",
  };
}

async function executeProductLookup(parsedIntent: ChatIntent): Promise<ExecutedChatQuery> {
  if (!parsedIntent.filters.productName && !parsedIntent.filters.search && !parsedIntent.filters.sku) {
    return {
      status: "unsupported",
      table: null,
      queryData: {
        filters: parsedIntent.filters,
      },
      fallbackAnswer: parsedIntent.clarificationNeeded ?? "Please mention the product name or SKU you want to inspect.",
    };
  }

  const matches = await getInventoryMatches({
    ...parsedIntent,
    filters: {
      ...parsedIntent.filters,
      includeArchived: true,
    },
  });
  const best = [...matches.items].sort(
    (left, right) => scoreProductMatch(right, parsedIntent) - scoreProductMatch(left, parsedIntent),
  )[0];

  if (!best) {
    return {
      status: "answered",
      table: null,
      queryData: {
        found: false,
        filters: parsedIntent.filters,
      },
      fallbackAnswer: "I could not find a product that matches that name or SKU.",
    };
  }

  const detail = await getInventoryProductDetail(best.id);

  return {
    status: "answered",
    table: {
      caption: "Product details",
      columns: ["Product", "SKU", "Category", "Brand", "Selling price", "Stock"],
      rows: [[
        best.name,
        best.sku,
        best.categoryName,
        best.brand ?? "-",
        formatCurrency(best.sellingPrice),
        `${best.currentStock}`,
      ]],
    },
    queryData: {
      found: true,
      product: detail?.product ?? best,
      recentTransactions: detail?.recentTransactions ?? [],
    },
    fallbackAnswer: `${best.name} is currently at ${best.currentStock} units with a selling price of ${formatCurrency(best.sellingPrice)}.${best.isArchived ? " This product is archived." : ""}`,
  };
}

async function getSalesSnapshot(parsedIntent: ChatIntent) {
  const dateRange = getDateRangeFromFilters(parsedIntent.filters);
  const result = await listSalesEntries({
    query: parsedIntent.filters.search ?? parsedIntent.filters.productName ?? "",
    category: parsedIntent.filters.category ?? "",
    brand: parsedIntent.filters.brand ?? "",
    mode: parsedIntent.filters.saleMode,
    dateFrom: dateRange.dateFrom,
    dateTo: dateRange.dateTo,
    page: 1,
    pageSize: 400,
  });

  return {
    ...result,
    dateRange,
  };
}

function buildSalesSummaryTable(
  result: Awaited<ReturnType<typeof getSalesSnapshot>>,
  saleMode: ChatIntent["filters"]["saleMode"],
  requestedMetrics: ChatRequestedMetrics,
  topProducts: SalesAggregateRow[],
  topBrands: SalesAggregateRow[],
  topCategories: SalesAggregateRow[],
): ChatTable {
  const rows: string[][] = [
    ["Date range", result.dateRange.label],
    ["Sale mode", saleMode],
    ["Sales lines", `${result.total}`],
    ["Units", `${result.totalQuantity}`],
    ["Revenue", formatCurrency(result.totalRevenue)],
  ];

  if (requestedMetrics.includeTopProduct && topProducts[0]) {
    rows.push([
      "Top product",
      `${topProducts[0].key} (${formatCurrency(topProducts[0].revenue)}, ${topProducts[0].quantity} units)`,
    ]);
  }

  if (requestedMetrics.includeTopBrand && topBrands[0]) {
    rows.push([
      "Top brand",
      `${topBrands[0].key} (${formatCurrency(topBrands[0].revenue)}, ${topBrands[0].quantity} units)`,
    ]);
  }

  if (requestedMetrics.includeTopCategory && topCategories[0]) {
    rows.push([
      "Top category",
      `${topCategories[0].key} (${formatCurrency(topCategories[0].revenue)}, ${topCategories[0].quantity} units)`,
    ]);
  }

  return {
    caption: "Sales summary",
    columns: ["Metric", "Value"],
    rows,
  };
}

async function executeSalesTotal(parsedIntent: ChatIntent): Promise<ExecutedChatQuery> {
  const result = await getSalesSnapshot(parsedIntent);
  const topProducts = aggregateSalesRows(result.items, (item) => item.productNameSnapshot);
  const topBrands = aggregateSalesRows(result.items, (item) => item.brandSnapshot ?? "No brand");
  const topCategories = aggregateSalesRows(result.items, (item) => item.categoryNameSnapshot ?? "Uncategorized");

  if (result.total === 0) {
    return {
      status: "answered",
      table: buildSalesSummaryTable(
        result,
        parsedIntent.filters.saleMode,
        parsedIntent.requestedMetrics,
        topProducts,
        topBrands,
        topCategories,
      ),
      queryData: {
        totalRevenue: result.totalRevenue,
        totalQuantity: result.totalQuantity,
        totalLines: result.total,
        dateRange: result.dateRange,
        filters: parsedIntent.filters,
        requestedMetrics: parsedIntent.requestedMetrics,
      },
      fallbackAnswer: `No ${parsedIntent.filters.saleMode === "all" ? "sales" : `${parsedIntent.filters.saleMode} sales`} matched ${result.dateRange.label}.`,
    };
  }

  const answerParts = [
    `${formatCurrency(result.totalRevenue)} came from ${result.total} sales lines and ${result.totalQuantity} units in ${result.dateRange.label}.`,
  ];

  if (parsedIntent.requestedMetrics.includeTopProduct && topProducts[0]) {
    answerParts.push(
      `Top product was ${topProducts[0].key} with ${formatCurrency(topProducts[0].revenue)} from ${topProducts[0].count} sale lines.`,
    );
  }

  if (parsedIntent.requestedMetrics.includeTopBrand && topBrands[0]) {
    answerParts.push(`Top brand was ${topBrands[0].key} with ${formatCurrency(topBrands[0].revenue)}.`);
  }

  if (parsedIntent.requestedMetrics.includeTopCategory && topCategories[0]) {
    answerParts.push(`Top category was ${topCategories[0].key} with ${formatCurrency(topCategories[0].revenue)}.`);
  }

  return {
    status: "answered",
    table: buildSalesSummaryTable(
      result,
      parsedIntent.filters.saleMode,
      parsedIntent.requestedMetrics,
      topProducts,
      topBrands,
      topCategories,
    ),
    queryData: {
      totalRevenue: result.totalRevenue,
      totalQuantity: result.totalQuantity,
      totalLines: result.total,
      dateRange: result.dateRange,
      filters: parsedIntent.filters,
      requestedMetrics: parsedIntent.requestedMetrics,
      topProduct: topProducts[0] ?? null,
      topBrand: topBrands[0] ?? null,
      topCategory: topCategories[0] ?? null,
    },
    fallbackAnswer: answerParts.join(" "),
  };
}

async function executeSalesByCategory(parsedIntent: ChatIntent): Promise<ExecutedChatQuery> {
  const result = await getSalesSnapshot(parsedIntent);
  const rows = aggregateSalesRows(result.items, (item) => item.categoryNameSnapshot ?? "Uncategorized");

  return {
    status: "answered",
    table: aggregateSalesTable(rows, "Sales by category", "Category", parsedIntent.filters.limit),
    queryData: {
      rows: rows.slice(0, parsedIntent.filters.limit),
      dateRange: result.dateRange,
      filters: parsedIntent.filters,
    },
    fallbackAnswer:
      rows.length > 0
        ? `${rows[0]?.key ?? "The top category"} led sales in ${result.dateRange.label} with ${formatCurrency(rows[0]?.revenue ?? 0)}.`
        : `No category sales matched that request for ${result.dateRange.label}.`,
  };
}

async function executeSalesByBrand(parsedIntent: ChatIntent): Promise<ExecutedChatQuery> {
  const result = await getSalesSnapshot(parsedIntent);
  const rows = aggregateSalesRows(result.items, (item) => item.brandSnapshot ?? "No brand");

  return {
    status: "answered",
    table: aggregateSalesTable(rows, "Sales by brand", "Brand", parsedIntent.filters.limit),
    queryData: {
      rows: rows.slice(0, parsedIntent.filters.limit),
      dateRange: result.dateRange,
      filters: parsedIntent.filters,
    },
    fallbackAnswer:
      rows.length > 0
        ? `${rows[0]?.key ?? "The top brand"} led sales in ${result.dateRange.label} with ${formatCurrency(rows[0]?.revenue ?? 0)}.`
        : `No brand sales matched that request for ${result.dateRange.label}.`,
  };
}

async function executeRecentActivitySummary(): Promise<ExecutedChatQuery> {
  const dashboard = await getDashboardData();

  return {
    status: "answered",
    table: {
      caption: "Recent activity",
      columns: ["Time", "Type", "Title", "Details"],
      rows: dashboard.recentActivity.slice(0, 5).map((item) => [
        formatDateTime(item.happenedAt),
        item.type,
        item.title,
        item.description,
      ]),
    },
    queryData: {
      activity: dashboard.recentActivity.slice(0, 5),
    },
    fallbackAnswer:
      dashboard.recentActivity.length > 0
        ? `The latest activity is ${dashboard.recentActivity[0]?.title ?? "the newest item"}, recorded on ${formatDateTime(dashboard.recentActivity[0]?.happenedAt ?? new Date().toISOString())}.`
        : "No recent activity is available yet.",
  };
}

async function executeDashboardSummary(): Promise<ExecutedChatQuery> {
  const dashboard = await getDashboardData();

  return {
    status: "answered",
    table: {
      caption: "Dashboard summary",
      columns: ["Metric", "Value"],
      rows: [
        ["Active products", `${dashboard.summary.activeProducts}`],
        ["Low-stock products", `${dashboard.summary.lowStockCount}`],
        ["Today revenue", formatCurrency(dashboard.summary.todayRevenue)],
        ["Last 7 days revenue", formatCurrency(dashboard.summary.last7DaysRevenue)],
      ],
    },
    queryData: {
      summary: dashboard.summary,
      lowStockItems: dashboard.lowStockItems.slice(0, 3),
    },
    fallbackAnswer: `${dashboard.summary.activeProducts} active products are in the catalog, ${dashboard.summary.lowStockCount} are low on stock, and today revenue is ${formatCurrency(dashboard.summary.todayRevenue)}. The last 7 days are ${formatPercent(dashboard.summary.last7DaysRevenue, dashboard.summary.previous7DaysRevenue)} versus the previous 7-day window.`,
  };
}

function executeUnsupported(parsedIntent: ChatIntent): ExecutedChatQuery {
  return {
    status: "unsupported",
    table: null,
    queryData: {
      clarificationNeeded: parsedIntent.clarificationNeeded,
      unsupportedReason: parsedIntent.unsupportedReason,
    },
    fallbackAnswer:
      parsedIntent.unsupportedReason ??
      parsedIntent.clarificationNeeded ??
      "I can help with inventory lookups, low-stock questions, product details, sales totals, brand or category breakdowns, recent activity, and dashboard summaries.",
  };
}

async function executeChatIntent(parsedIntent: ChatIntent): Promise<ExecutedChatQuery> {
  switch (parsedIntent.intent) {
    case "inventory_count":
      return executeInventoryCount(parsedIntent);
    case "inventory_search":
      return executeInventorySearch(parsedIntent);
    case "low_stock_list":
      return executeLowStockList(parsedIntent);
    case "product_lookup":
      return executeProductLookup(parsedIntent);
    case "sales_total":
      return executeSalesTotal(parsedIntent);
    case "sales_by_category":
      return executeSalesByCategory(parsedIntent);
    case "sales_by_brand":
      return executeSalesByBrand(parsedIntent);
    case "recent_activity_summary":
      return executeRecentActivitySummary();
    case "dashboard_summary":
      return executeDashboardSummary();
    case "unsupported_request":
    default:
      return executeUnsupported(parsedIntent);
  }
}

async function insertChatLog(input: {
  user: UserSummary;
  question: string;
  parsedIntent: ChatIntent;
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
        parsed_intent_json: input.parsedIntent,
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

export async function runChatQuery(question: string, user: UserSummary): Promise<ChatQueryResult> {
  let parsedIntent: ChatIntent;
  let intentSource: ChatQueryResult["source"]["intent"] = "heuristic";

  try {
    parsedIntent = await parseIntentWithOpenAi(question);
    intentSource = "openai";
  } catch (error) {
    console.warn("Falling back to heuristic intent parsing for chat.", error);
    parsedIntent = buildHeuristicIntent(question);
  }

  const executed = await executeChatIntent(parsedIntent);
  const answer = executed.fallbackAnswer;

  await insertChatLog({
    user,
    question,
    parsedIntent,
    responseText: answer,
    status: executed.status,
  });

  return {
    status: executed.status,
    answer,
    parsedIntent,
    table: executed.table,
    source: {
      intent: intentSource,
      answer: "fallback",
    },
  };
}
