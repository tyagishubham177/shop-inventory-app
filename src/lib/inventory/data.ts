import type { UserSummary } from "@/lib/auth/types";
import { serverEnv } from "@/lib/env";
import type {
  InventoryCategoryOption,
  InventoryListFilters,
  InventoryListResult,
  InventoryProduct,
  InventoryProductDetail,
  InventoryTransaction,
  InventoryTransactionType,
  InventoryUpsertInput,
} from "@/lib/inventory/types";
import { isUuidLike } from "@/lib/inventory/validation";

type InventoryProductRow = {
  id: string;
  sku: string;
  name: string;
  brand: string | null;
  category_id: string;
  category_name: string;
  size: string | null;
  color: string | null;
  purchase_price: number | string;
  selling_price: number | string;
  current_stock: number;
  reorder_level: number;
  location: string | null;
  notes: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

type InventoryTransactionRow = {
  id: string;
  product_id: string;
  transaction_type: InventoryTransactionType;
  quantity_delta: number;
  reason: string;
  performed_by: string;
  created_at: string;
};

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  sort_order: number;
};

const INVENTORY_SELECT =
  "id,sku,name,brand,category_id,category_name,size,color,purchase_price,selling_price,current_stock,reorder_level,location,notes,is_archived,created_at,updated_at";
const TRANSACTION_SELECT =
  "id,product_id,transaction_type,quantity_delta,reason,performed_by,created_at";
const CATEGORY_SELECT = "id,name,slug,is_active,sort_order";

function assertInventoryDatabaseConfig() {
  if (!serverEnv.supabaseUrl || !serverEnv.supabaseServiceRoleKey) {
    throw new Error(
      "Inventory requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local so the app can read and write product data.",
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

function mapInventoryProduct(row: InventoryProductRow): InventoryProduct {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    brand: row.brand,
    categoryId: row.category_id,
    categoryName: row.category_name,
    size: row.size,
    color: row.color,
    purchasePrice: toNumber(row.purchase_price),
    sellingPrice: toNumber(row.selling_price),
    currentStock: row.current_stock,
    reorderLevel: row.reorder_level,
    location: row.location,
    notes: row.notes,
    isArchived: row.is_archived,
    isLowStock: row.current_stock <= row.reorder_level,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTransaction(row: InventoryTransactionRow): InventoryTransaction {
  return {
    id: row.id,
    productId: row.product_id,
    transactionType: row.transaction_type,
    quantityDelta: row.quantity_delta,
    reason: row.reason,
    performedBy: row.performed_by,
    createdAt: row.created_at,
  };
}

function mapCategory(row: CategoryRow): InventoryCategoryOption {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    isActive: row.is_active,
    sortOrder: row.sort_order,
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
  const config = assertInventoryDatabaseConfig();
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
      `Supabase inventory request failed with status ${response.status}${detail ? `: ${detail}` : "."}`,
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

async function getCategoryById(id: string) {
  const query = new URLSearchParams({
    select: CATEGORY_SELECT,
    id: `eq.${id}`,
    limit: "1",
  });

  const { data } = await requestSupabase<CategoryRow[]>("category_master", {
    query,
  });

  return data[0] ? mapCategory(data[0]) : null;
}

async function createInventoryTransaction(params: {
  productId: string;
  transactionType: InventoryTransactionType;
  quantityDelta: number;
  reason: string;
  performedBy: string;
}) {
  await requestSupabase<InventoryTransactionRow[]>("inventory_transactions", {
    method: "POST",
    query: new URLSearchParams({
      select: TRANSACTION_SELECT,
    }),
    prefer: "return=representation",
    body: {
      product_id: params.productId,
      transaction_type: params.transactionType,
      quantity_delta: params.quantityDelta,
      reason: params.reason,
      performed_by: params.performedBy,
    },
  });
}

function ensureMutationActor(user: UserSummary) {
  if (!isUuidLike(user.id)) {
    throw new Error(
      "Inventory write actions require a database-backed user. Seed the dev users in Supabase, sign in again, and retry the change.",
    );
  }

  return user.id;
}

export async function getInventoryCategories() {
  const query = new URLSearchParams({
    select: CATEGORY_SELECT,
    is_active: "eq.true",
    order: "sort_order.asc",
    limit: "100",
  });

  const { data } = await requestSupabase<CategoryRow[]>("category_master", {
    query,
  });

  return data.map(mapCategory).sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return left.name.localeCompare(right.name);
  });
}

export async function listInventoryProducts(filters: InventoryListFilters): Promise<InventoryListResult> {
  const query = new URLSearchParams({
    select: INVENTORY_SELECT,
    order: "updated_at.desc",
    limit: "200",
  });

  if (filters.categoryId) {
    query.set("category_id", `eq.${filters.categoryId}`);
  }

  if (filters.archived === "active") {
    query.set("is_archived", "eq.false");
  }

  if (filters.archived === "archived") {
    query.set("is_archived", "eq.true");
  }

  if (filters.brand) {
    query.set("brand", `ilike.*${sanitizeSearchTerm(filters.brand)}*`);
  }

  if (filters.query) {
    const term = sanitizeSearchTerm(filters.query);

    if (term) {
      query.set(
        "or",
        `(sku.ilike.*${term}*,name.ilike.*${term}*,brand.ilike.*${term}*,category_name.ilike.*${term}*)`,
      );
    }
  }

  const { data } = await requestSupabase<InventoryProductRow[]>("inventory_products", {
    query,
  });
  const filtered = data
    .map(mapInventoryProduct)
    .filter((product) => (filters.lowStock ? product.isLowStock : true));
  const total = filtered.length;
  const totalPages = total === 0 ? 1 : Math.ceil(total / filters.pageSize);
  const page = Math.min(filters.page, totalPages);
  const start = (page - 1) * filters.pageSize;
  const end = start + filters.pageSize;

  return {
    items: filtered.slice(start, end),
    total,
    page,
    pageSize: filters.pageSize,
    totalPages,
  };
}

export async function getInventoryProductDetail(id: string): Promise<InventoryProductDetail | null> {
  const productQuery = new URLSearchParams({
    select: INVENTORY_SELECT,
    id: `eq.${id}`,
    limit: "1",
  });
  const transactionQuery = new URLSearchParams({
    select: TRANSACTION_SELECT,
    product_id: `eq.${id}`,
    order: "created_at.desc",
    limit: "8",
  });

  const [{ data: productRows }, { data: transactionRows }] = await Promise.all([
    requestSupabase<InventoryProductRow[]>("inventory_products", {
      query: productQuery,
    }),
    requestSupabase<InventoryTransactionRow[]>("inventory_transactions", {
      query: transactionQuery,
    }),
  ]);

  const row = productRows[0];

  if (!row) {
    return null;
  }

  return {
    product: mapInventoryProduct(row),
    recentTransactions: transactionRows.map(mapTransaction),
  };
}

export async function createInventoryProduct(input: InventoryUpsertInput, user: UserSummary) {
  const actorId = ensureMutationActor(user);
  const category = await getCategoryById(input.categoryId);

  if (!category || !category.isActive) {
    throw new Error("Select an active category before saving the product.");
  }

  const { data } = await requestSupabase<InventoryProductRow[]>("inventory_products", {
    method: "POST",
    query: new URLSearchParams({
      select: INVENTORY_SELECT,
    }),
    prefer: "return=representation",
    body: {
      sku: input.sku,
      name: input.name,
      brand: input.brand,
      category_id: input.categoryId,
      category_name: category.name,
      size: input.size,
      color: input.color,
      purchase_price: input.purchasePrice,
      selling_price: input.sellingPrice,
      current_stock: input.currentStock,
      reorder_level: input.reorderLevel,
      location: input.location,
      notes: input.notes,
    },
  });

  const row = data[0];

  if (!row) {
    throw new Error("Inventory product creation did not return the saved record.");
  }

  if (input.currentStock > 0) {
    await createInventoryTransaction({
      productId: row.id,
      transactionType: "stock_in",
      quantityDelta: input.currentStock,
      reason: input.stockReason ?? "Opening stock created with the product record.",
      performedBy: actorId,
    });
  }

  return mapInventoryProduct(row);
}

export async function updateInventoryProduct(id: string, input: InventoryUpsertInput, user: UserSummary) {
  const actorId = ensureMutationActor(user);
  const existing = await getInventoryProductDetail(id);

  if (!existing) {
    throw new Error("The product could not be found.");
  }

  const category = await getCategoryById(input.categoryId);

  if (!category) {
    throw new Error("Select a valid category before saving the product.");
  }

  const { data } = await requestSupabase<InventoryProductRow[]>("inventory_products", {
    method: "PATCH",
    query: new URLSearchParams({
      id: `eq.${id}`,
      select: INVENTORY_SELECT,
    }),
    prefer: "return=representation",
    body: {
      sku: input.sku,
      name: input.name,
      brand: input.brand,
      category_id: input.categoryId,
      category_name: category.name,
      size: input.size,
      color: input.color,
      purchase_price: input.purchasePrice,
      selling_price: input.sellingPrice,
      current_stock: input.currentStock,
      reorder_level: input.reorderLevel,
      location: input.location,
      notes: input.notes,
    },
  });

  const row = data[0];

  if (!row) {
    throw new Error("Inventory product update did not return the saved record.");
  }

  const stockDelta = input.currentStock - existing.product.currentStock;

  if (stockDelta !== 0) {
    await createInventoryTransaction({
      productId: id,
      transactionType: "adjustment",
      quantityDelta: stockDelta,
      reason: input.stockReason ?? "Stock adjusted from the inventory edit screen.",
      performedBy: actorId,
    });
  }

  return mapInventoryProduct(row);
}

async function setInventoryArchivedState(id: string, isArchived: boolean, user: UserSummary) {
  const actorId = ensureMutationActor(user);
  const detail = await getInventoryProductDetail(id);

  if (!detail) {
    throw new Error("The product could not be found.");
  }

  if (detail.product.isArchived === isArchived) {
    return detail.product;
  }

  const { data } = await requestSupabase<InventoryProductRow[]>("inventory_products", {
    method: "PATCH",
    query: new URLSearchParams({
      id: `eq.${id}`,
      select: INVENTORY_SELECT,
    }),
    prefer: "return=representation",
    body: {
      is_archived: isArchived,
    },
  });

  const row = data[0];

  if (!row) {
    throw new Error("The product archive change did not return the updated record.");
  }

  await createInventoryTransaction({
    productId: id,
    transactionType: isArchived ? "archive" : "restore",
    quantityDelta: 0,
    reason: isArchived
      ? "Product archived from the inventory detail screen."
      : "Product restored from the inventory detail screen.",
    performedBy: actorId,
  });

  return mapInventoryProduct(row);
}

export async function archiveInventoryProduct(id: string, user: UserSummary) {
  return setInventoryArchivedState(id, true, user);
}

export async function restoreInventoryProduct(id: string, user: UserSummary) {
  return setInventoryArchivedState(id, false, user);
}
