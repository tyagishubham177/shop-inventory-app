import type { UserSummary } from "@/lib/auth/types";
import { serverEnv } from "@/lib/env";
import { isUuidLike } from "@/lib/inventory/validation";
import type {
  SaleEntry,
  SalesListFilters,
  SalesListResult,
  SalesMode,
  SalesProductOption,
  SaleUpsertInput,
} from "@/lib/sales/types";

type SaleRow = {
  id: string;
  product_id: string | null;
  product_name_snapshot: string;
  category_name_snapshot: string | null;
  brand_snapshot: string | null;
  size_snapshot: string | null;
  color_snapshot: string | null;
  quantity: number;
  unit_price: number | string;
  line_total: number | string;
  sale_mode: SalesMode;
  sold_at: string;
  created_by: string;
  notes: string | null;
};

type InventoryProductRow = {
  id: string;
  sku: string;
  name: string;
  brand: string | null;
  category_name: string;
  size: string | null;
  color: string | null;
  current_stock: number;
  selling_price: number | string;
  is_archived: boolean;
};

type InventoryTransactionType = "stock_in" | "stock_out";

const SALES_SELECT =
  "id,product_id,product_name_snapshot,category_name_snapshot,brand_snapshot,size_snapshot,color_snapshot,quantity,unit_price,line_total,sale_mode,sold_at,created_by,notes";
const SALES_PRODUCT_SELECT =
  "id,sku,name,brand,category_name,size,color,current_stock,selling_price,is_archived";

function assertSalesDatabaseConfig() {
  if (!serverEnv.supabaseUrl || !serverEnv.supabaseServiceRoleKey) {
    throw new Error(
      "Sales requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local so the app can read and write sale data.",
    );
  }

  return {
    url: serverEnv.supabaseUrl,
    serviceRoleKey: serverEnv.supabaseServiceRoleKey,
  };
}

function sanitizeSearchTerm(value: string) {
  return value.replace(/[,%()]/g, " ").replace(/\s+/g, " ").trim();
}

function toNumber(value: number | string) {
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function mapSale(row: SaleRow): SaleEntry {
  return {
    id: row.id,
    productId: row.product_id,
    productNameSnapshot: row.product_name_snapshot,
    categoryNameSnapshot: row.category_name_snapshot,
    brandSnapshot: row.brand_snapshot,
    sizeSnapshot: row.size_snapshot,
    colorSnapshot: row.color_snapshot,
    quantity: row.quantity,
    unitPrice: toNumber(row.unit_price),
    lineTotal: toNumber(row.line_total),
    saleMode: row.sale_mode,
    soldAt: row.sold_at,
    createdBy: row.created_by,
    notes: row.notes,
  };
}

function mapSalesProduct(row: InventoryProductRow): SalesProductOption {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    brand: row.brand,
    categoryName: row.category_name,
    size: row.size,
    color: row.color,
    currentStock: row.current_stock,
    sellingPrice: toNumber(row.selling_price),
  };
}

async function requestSupabase<T>(
  path: string,
  options?: {
    method?: "GET" | "POST" | "PATCH";
    body?: unknown;
    prefer?: string;
    query?: URLSearchParams;
  },
) {
  const config = assertSalesDatabaseConfig();
  const url = new URL(`/rest/v1/${path}`, config.url);

  if (options?.query) {
    url.search = options.query.toString();
  }

  const response = await fetch(url.toString(), {
    method: options?.method ?? "GET",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      Accept: "application/json",
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
      ...(options?.prefer ? { Prefer: options.prefer } : {}),
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Supabase sales request failed with status ${response.status}${detail ? `: ${detail}` : "."}`,
    );
  }

  if (response.status === 204) {
    return {
      data: null as T,
      response,
    };
  }

  const text = await response.text();

  return {
    data: (text ? (JSON.parse(text) as T) : null) as T,
    response,
  };
}

function ensureMutationActor(user: UserSummary) {
  if (!isUuidLike(user.id)) {
    throw new Error(
      "Sales write actions require a database-backed user. Seed the dev users in Supabase, sign in again, and retry the change.",
    );
  }

  return user.id;
}

async function getInventoryProductById(id: string) {
  const query = new URLSearchParams({
    select: SALES_PRODUCT_SELECT,
    id: `eq.${id}`,
    limit: "1",
  });

  const { data } = await requestSupabase<InventoryProductRow[]>("inventory_products", {
    query,
  });

  return data[0] ?? null;
}

async function setInventoryStock(productId: string, currentStock: number) {
  await requestSupabase<InventoryProductRow[]>("inventory_products", {
    method: "PATCH",
    query: new URLSearchParams({
      id: `eq.${productId}`,
      select: SALES_PRODUCT_SELECT,
    }),
    prefer: "return=representation",
    body: {
      current_stock: currentStock,
    },
  });
}

async function createInventoryTransaction(params: {
  productId: string;
  quantityDelta: number;
  transactionType: InventoryTransactionType;
  reason: string;
  performedBy: string;
}) {
  await requestSupabase("inventory_transactions", {
    method: "POST",
    prefer: "return=minimal",
    body: {
      product_id: params.productId,
      transaction_type: params.transactionType,
      quantity_delta: params.quantityDelta,
      reason: params.reason,
      performed_by: params.performedBy,
    },
  });
}

async function insertSaleRecord(input: {
  payload: SaleUpsertInput;
  createdBy: string;
  snapshot: {
    productId: string | null;
    productNameSnapshot: string;
    categoryNameSnapshot: string | null;
    brandSnapshot: string | null;
    sizeSnapshot: string | null;
    colorSnapshot: string | null;
  };
}) {
  const { data } = await requestSupabase<SaleRow[]>("sales_entries", {
    method: "POST",
    query: new URLSearchParams({
      select: SALES_SELECT,
    }),
    prefer: "return=representation",
    body: {
      product_id: input.snapshot.productId,
      product_name_snapshot: input.snapshot.productNameSnapshot,
      category_name_snapshot: input.snapshot.categoryNameSnapshot,
      brand_snapshot: input.snapshot.brandSnapshot,
      size_snapshot: input.snapshot.sizeSnapshot,
      color_snapshot: input.snapshot.colorSnapshot,
      quantity: input.payload.quantity,
      unit_price: input.payload.unitPrice,
      sale_mode: input.payload.saleMode,
      sold_at: input.payload.soldAt,
      created_by: input.createdBy,
      notes: input.payload.notes,
    },
  });

  const row = data[0];

  if (!row) {
    throw new Error("Sale creation did not return the saved record.");
  }

  return row;
}

async function updateSaleRecord(input: {
  saleId: string;
  payload: SaleUpsertInput;
  snapshot: {
    productId: string | null;
    productNameSnapshot: string;
    categoryNameSnapshot: string | null;
    brandSnapshot: string | null;
    sizeSnapshot: string | null;
    colorSnapshot: string | null;
  };
}) {
  const { data } = await requestSupabase<SaleRow[]>("sales_entries", {
    method: "PATCH",
    query: new URLSearchParams({
      id: `eq.${input.saleId}`,
      select: SALES_SELECT,
    }),
    prefer: "return=representation",
    body: {
      product_id: input.snapshot.productId,
      product_name_snapshot: input.snapshot.productNameSnapshot,
      category_name_snapshot: input.snapshot.categoryNameSnapshot,
      brand_snapshot: input.snapshot.brandSnapshot,
      size_snapshot: input.snapshot.sizeSnapshot,
      color_snapshot: input.snapshot.colorSnapshot,
      quantity: input.payload.quantity,
      unit_price: input.payload.unitPrice,
      sale_mode: input.payload.saleMode,
      sold_at: input.payload.soldAt,
      notes: input.payload.notes,
    },
  });

  const row = data[0];

  if (!row) {
    throw new Error("Sale update did not return the saved record.");
  }

  return row;
}

function createManualSaleSnapshot(input: SaleUpsertInput) {
  return {
    productId: null,
    productNameSnapshot: input.productName ?? "Manual sale",
    categoryNameSnapshot: input.categoryName,
    brandSnapshot: input.brand,
    sizeSnapshot: input.size,
    colorSnapshot: input.color,
  };
}

async function getLinkedSaleSnapshot(input: SaleUpsertInput) {
  const product = await getInventoryProductById(input.productId ?? "");

  if (!product) {
    throw new Error("The linked inventory product could not be found.");
  }

  if (product.is_archived) {
    throw new Error("Archived inventory products cannot be used for linked sales.");
  }

  return {
    product,
    snapshot: {
      productId: product.id,
      productNameSnapshot: product.name,
      categoryNameSnapshot: product.category_name,
      brandSnapshot: product.brand,
      sizeSnapshot: product.size,
      colorSnapshot: product.color,
    },
  };
}

export async function getSalesProductOptions() {
  const query = new URLSearchParams({
    select: SALES_PRODUCT_SELECT,
    is_archived: "eq.false",
    order: "name.asc",
    limit: "200",
  });

  const { data } = await requestSupabase<InventoryProductRow[]>("inventory_products", {
    query,
  });

  return data.map(mapSalesProduct);
}

export async function listSalesEntries(filters: SalesListFilters): Promise<SalesListResult> {
  const query = new URLSearchParams({
    select: SALES_SELECT,
    order: "sold_at.desc",
    limit: "400",
  });

  if (filters.mode !== "all") {
    query.set("sale_mode", `eq.${filters.mode}`);
  }

  if (filters.category) {
    query.set("category_name_snapshot", `ilike.*${sanitizeSearchTerm(filters.category)}*`);
  }

  if (filters.brand) {
    query.set("brand_snapshot", `ilike.*${sanitizeSearchTerm(filters.brand)}*`);
  }

  if (filters.dateFrom) {
    const start = new Date(`${filters.dateFrom}T00:00:00`);

    if (!Number.isNaN(start.getTime())) {
      query.append("sold_at", `gte.${start.toISOString()}`);
    }
  }

  if (filters.dateTo) {
    const end = new Date(`${filters.dateTo}T23:59:59.999`);

    if (!Number.isNaN(end.getTime())) {
      query.append("sold_at", `lte.${end.toISOString()}`);
    }
  }

  if (filters.query) {
    const term = sanitizeSearchTerm(filters.query);

    if (term) {
      query.set(
        "or",
        `(product_name_snapshot.ilike.*${term}*,category_name_snapshot.ilike.*${term}*,brand_snapshot.ilike.*${term}*,notes.ilike.*${term}*)`,
      );
    }
  }

  const { data } = await requestSupabase<SaleRow[]>("sales_entries", {
    query,
  });
  const items = data.map(mapSale);
  const total = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalRevenue = roundCurrency(items.reduce((sum, item) => sum + item.lineTotal, 0));
  const totalPages = total === 0 ? 1 : Math.ceil(total / filters.pageSize);
  const page = Math.min(filters.page, totalPages);
  const start = (page - 1) * filters.pageSize;
  const end = start + filters.pageSize;

  return {
    items: items.slice(start, end),
    total,
    totalQuantity,
    totalRevenue,
    page,
    pageSize: filters.pageSize,
    totalPages,
  };
}

export async function getSaleEntry(id: string): Promise<SaleEntry | null> {
  const query = new URLSearchParams({
    select: SALES_SELECT,
    id: `eq.${id}`,
    limit: "1",
  });

  const { data } = await requestSupabase<SaleRow[]>("sales_entries", {
    query,
  });

  return data[0] ? mapSale(data[0]) : null;
}

export async function createSalesEntries(inputs: SaleUpsertInput[], user: UserSummary) {
  const actorId = ensureMutationActor(user);
  const savedRows: SaleRow[] = [];

  for (const input of inputs) {
    if (input.saleMode === "manual") {
      const row = await insertSaleRecord({
        payload: input,
        createdBy: actorId,
        snapshot: createManualSaleSnapshot(input),
      });

      savedRows.push(row);
      continue;
    }

    const linked = await getLinkedSaleSnapshot(input);

    if (linked.product.current_stock < input.quantity) {
      throw new Error(
        `Only ${linked.product.current_stock} units are available for ${linked.product.name}. Reduce the quantity or use a manual sale entry.`,
      );
    }

    const nextStock = linked.product.current_stock - input.quantity;
    await setInventoryStock(linked.product.id, nextStock);

    try {
      const row = await insertSaleRecord({
        payload: input,
        createdBy: actorId,
        snapshot: linked.snapshot,
      });

      await createInventoryTransaction({
        productId: linked.product.id,
        quantityDelta: -input.quantity,
        transactionType: "stock_out",
        reason: `Stock deducted for linked sale ${row.id}.`,
        performedBy: actorId,
      });

      savedRows.push(row);
    } catch (error) {
      await setInventoryStock(linked.product.id, linked.product.current_stock);
      throw error;
    }
  }

  return savedRows.map(mapSale);
}

export async function updateSaleEntry(id: string, input: SaleUpsertInput, user: UserSummary) {
  const actorId = ensureMutationActor(user);
  const existing = await getSaleEntry(id);

  if (!existing) {
    throw new Error("The sale entry could not be found.");
  }

  const stockTargets = new Map<string, { original: number; next: number; name: string }>();
  let snapshot:
    | {
        productId: string | null;
        productNameSnapshot: string;
        categoryNameSnapshot: string | null;
        brandSnapshot: string | null;
        sizeSnapshot: string | null;
        colorSnapshot: string | null;
      }
    | undefined;

  if (existing.saleMode === "linked" && existing.productId) {
    const previousProduct = await getInventoryProductById(existing.productId);

    if (!previousProduct) {
      throw new Error("The original linked product could not be loaded for correction.");
    }

    stockTargets.set(previousProduct.id, {
      original: previousProduct.current_stock,
      next: previousProduct.current_stock + existing.quantity,
      name: previousProduct.name,
    });
  }

  if (input.saleMode === "manual") {
    snapshot = createManualSaleSnapshot(input);
  } else {
    const linked = await getLinkedSaleSnapshot(input);

    const existingTarget = stockTargets.get(linked.product.id);
    const availableStock = existingTarget ? existingTarget.next : linked.product.current_stock;

    if (availableStock < input.quantity) {
      throw new Error(
        `Only ${availableStock} units are available for ${linked.product.name} after applying the correction.`,
      );
    }

    stockTargets.set(linked.product.id, {
      original: existingTarget?.original ?? linked.product.current_stock,
      next: availableStock - input.quantity,
      name: linked.product.name,
    });
    snapshot = linked.snapshot;
  }

  const changedTargets = [...stockTargets.entries()].filter(([, value]) => value.original !== value.next);

  for (const [productId, target] of changedTargets) {
    await setInventoryStock(productId, target.next);
  }

  try {
    const updated = await updateSaleRecord({
      saleId: id,
      payload: input,
      snapshot: snapshot ?? createManualSaleSnapshot(input),
    });

    for (const [productId, target] of changedTargets) {
      const delta = target.next - target.original;

      if (delta === 0) {
        continue;
      }

      await createInventoryTransaction({
        productId,
        quantityDelta: delta,
        transactionType: delta > 0 ? "stock_in" : "stock_out",
        reason: `Stock corrected after editing sale ${id}.`,
        performedBy: actorId,
      });
    }

    return mapSale(updated);
  } catch (error) {
    for (const [productId, target] of changedTargets) {
      await setInventoryStock(productId, target.original);
    }

    throw error;
  }
}






