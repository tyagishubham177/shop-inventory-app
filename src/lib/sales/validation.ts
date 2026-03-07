import { isUuidLike } from "@/lib/inventory/validation";
import type {
  SalesListFilters,
  SalesMode,
  SalesValidationResult,
  SaleUpsertInput,
} from "@/lib/sales/types";

type SearchParamRecord = Record<string, string | string[] | undefined>;

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

  if (!Number.isInteger(parsed) || parsed < 1) {
    errors.push(`${label} must be a whole number that is 1 or more.`);
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
  }

  return normalized.slice(0, maxLength);
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

function normalizeMode(value: unknown): SalesMode {
  return value === "manual" ? "manual" : "linked";
}

function normalizeDateTime(value: unknown, errors: string[]) {
  const normalized = normalizeOptionalText(value);

  if (!normalized) {
    errors.push("Sold at is required.");
    return "";
  }

  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    errors.push("Provide a valid sold-at date and time.");
    return "";
  }

  return parsed.toISOString();
}

function validateSaleInput(body: unknown, prefix?: string): SalesValidationResult<SaleUpsertInput> {
  const errors: string[] = [];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      success: false,
      errors: [`${prefix ?? "Sale"} must be a valid JSON object.`],
    };
  }

  const record = body as Record<string, unknown>;
  const saleMode = normalizeMode(record.saleMode);
  const productId = normalizeOptionalText(record.productId);

  const payload: SaleUpsertInput = {
    saleMode,
    productId: saleMode === "linked" ? productId || null : null,
    productName:
      saleMode === "manual"
        ? validateRequiredText(record.productName, "Product name", 160, errors)
        : null,
    categoryName:
      saleMode === "manual"
        ? validateOptionalText(record.categoryName, "Category name", 120, errors)
        : null,
    brand:
      saleMode === "manual"
        ? validateOptionalText(record.brand, "Brand", 80, errors)
        : null,
    size:
      saleMode === "manual"
        ? validateOptionalText(record.size, "Size", 40, errors)
        : null,
    color:
      saleMode === "manual"
        ? validateOptionalText(record.color, "Color", 40, errors)
        : null,
    quantity: parseWholeNumber(record.quantity, "Quantity", errors),
    unitPrice: parseCurrency(record.unitPrice, "Unit price", errors),
    soldAt: normalizeDateTime(record.soldAt, errors),
    notes: validateOptionalText(record.notes, "Notes", 500, errors),
  };

  if (saleMode === "linked") {
    if (!productId) {
      errors.push("Select a linked inventory product.");
    } else if (!isUuidLike(productId)) {
      errors.push("Select a valid linked inventory product.");
    }
  }

  if (payload.quantity > 0 && payload.unitPrice === 0) {
    errors.push("Unit price must be more than 0 for a sale line.");
  }

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

export function parseSalesListFilters(input: URLSearchParams | SearchParamRecord): SalesListFilters {
  const modeValue = readValue(input, "mode").trim().toLowerCase();

  return {
    query: readValue(input, "query").trim(),
    category: readValue(input, "category").trim(),
    brand: readValue(input, "brand").trim(),
    mode: modeValue === "linked" || modeValue === "manual" ? modeValue : "all",
    dateFrom: readValue(input, "dateFrom").trim(),
    dateTo: readValue(input, "dateTo").trim(),
    page: parsePositiveInteger(readValue(input, "page"), 1, 999),
    pageSize: parsePositiveInteger(readValue(input, "pageSize"), 12, 50),
  };
}

export function validateSaleUpsertInput(body: unknown): SalesValidationResult<SaleUpsertInput> {
  return validateSaleInput(body);
}

export function validateSalesCreateInput(
  body: unknown,
): SalesValidationResult<SaleUpsertInput[]> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      success: false,
      errors: ["Send a valid JSON object for the sale payload."],
    };
  }

  const record = body as Record<string, unknown>;

  if (!Array.isArray(record.items)) {
    const single = validateSaleInput(body);

    if (!single.success) {
      return single;
    }

    return {
      success: true,
      data: [single.data],
    };
  }

  if (record.items.length === 0) {
    return {
      success: false,
      errors: ["Add at least one sale line item."],
    };
  }

  const items: SaleUpsertInput[] = [];
  const errors: string[] = [];

  record.items.forEach((item, index) => {
    const validation = validateSaleInput(item, `Sale item ${index + 1}`);

    if (validation.success) {
      items.push(validation.data);
      return;
    }

    validation.errors.forEach((error) => {
      errors.push(`Sale item ${index + 1}: ${error}`);
    });
  });

  if (errors.length) {
    return {
      success: false,
      errors,
    };
  }

  return {
    success: true,
    data: items,
  };
}
