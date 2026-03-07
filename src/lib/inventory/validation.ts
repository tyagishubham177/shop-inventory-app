import type {
  InventoryArchivedFilter,
  InventoryListFilters,
  InventoryUpsertInput,
  InventoryValidationResult,
} from "@/lib/inventory/types";

type SearchParamRecord = Record<string, string | string[] | undefined>;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function readValue(input: URLSearchParams | SearchParamRecord, key: string) {
  if (input instanceof URLSearchParams) {
    return input.get(key) ?? "";
  }

  const value = input[key];

  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function normalizeOptionalText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parsePositiveInteger(value: string, fallback: number, max: number) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(parsed, max);
}

function parseArchivedFilter(value: string): InventoryArchivedFilter {
  if (value === "archived" || value === "all") {
    return value;
  }

  return "active";
}

function parseBooleanFlag(value: string) {
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function parseCurrency(value: unknown, label: string, errors: string[]) {
  const parsed = Number.parseFloat(String(value ?? "").trim());

  if (!Number.isFinite(parsed) || parsed < 0) {
    errors.push(`${label} must be a number that is 0 or more.`);
    return 0;
  }

  return Math.round(parsed * 100) / 100;
}

function parseWholeNumber(value: unknown, label: string, errors: string[]) {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);

  if (!Number.isInteger(parsed) || parsed < 0) {
    errors.push(`${label} must be a whole number that is 0 or more.`);
    return 0;
  }

  return parsed;
}

function validateRequiredText(value: unknown, label: string, maxLength: number, errors: string[]) {
  const normalized = normalizeOptionalText(value);

  if (!normalized) {
    errors.push(`${label} is required.`);
    return "";
  }

  if (normalized.length > maxLength) {
    errors.push(`${label} must be ${maxLength} characters or fewer.`);
    return normalized;
  }

  return normalized;
}

function validateOptionalText(value: unknown, label: string, maxLength: number, errors: string[]) {
  const normalized = normalizeOptionalText(value);

  if (!normalized) {
    return null;
  }

  if (normalized.length > maxLength) {
    errors.push(`${label} must be ${maxLength} characters or fewer.`);
  }

  return normalized.slice(0, maxLength);
}

export function isUuidLike(value: string) {
  return UUID_PATTERN.test(value.trim());
}

export function parseInventoryListFilters(
  input: URLSearchParams | SearchParamRecord,
): InventoryListFilters {
  return {
    query: readValue(input, "query").trim(),
    categoryId: readValue(input, "category").trim(),
    brand: readValue(input, "brand").trim(),
    archived: parseArchivedFilter(readValue(input, "archived").trim().toLowerCase()),
    lowStock: parseBooleanFlag(readValue(input, "lowStock")),
    page: parsePositiveInteger(readValue(input, "page"), 1, 999),
    pageSize: parsePositiveInteger(readValue(input, "pageSize"), 12, 50),
  };
}

export function validateInventoryUpsertInput(
  body: unknown,
): InventoryValidationResult<InventoryUpsertInput> {
  const errors: string[] = [];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      success: false,
      errors: ["Send a valid JSON object for the inventory record."],
    };
  }

  const record = body as Record<string, unknown>;
  const categoryId = normalizeOptionalText(record.categoryId);

  if (!categoryId) {
    errors.push("Category is required.");
  } else if (!isUuidLike(categoryId)) {
    errors.push("Select a valid category.");
  }

  const payload: InventoryUpsertInput = {
    sku: validateRequiredText(record.sku, "SKU", 64, errors),
    name: validateRequiredText(record.name, "Product name", 160, errors),
    brand: validateOptionalText(record.brand, "Brand", 80, errors),
    categoryId,
    size: validateOptionalText(record.size, "Size", 40, errors),
    color: validateOptionalText(record.color, "Color", 40, errors),
    purchasePrice: parseCurrency(record.purchasePrice, "Purchase price", errors),
    sellingPrice: parseCurrency(record.sellingPrice, "Selling price", errors),
    currentStock: parseWholeNumber(record.currentStock, "Current stock", errors),
    reorderLevel: parseWholeNumber(record.reorderLevel, "Reorder level", errors),
    location: validateOptionalText(record.location, "Location", 80, errors),
    notes: validateOptionalText(record.notes, "Notes", 500, errors),
    stockReason: validateOptionalText(record.stockReason, "Stock change reason", 240, errors),
  };

  if (!errors.length) {
    return {
      success: true,
      data: payload,
    };
  }

  return {
    success: false,
    errors,
  };
}
