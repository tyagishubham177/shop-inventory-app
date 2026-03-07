import { serverEnv } from "@/lib/env";
import type {
  DashboardActivityItem,
  DashboardData,
  DashboardLowStockItem,
  DashboardRecentSale,
  DashboardSummary,
} from "@/lib/dashboard/types";

type InventoryProductRow = {
  id: string;
  sku: string;
  name: string;
  category_name: string;
  current_stock: number;
  reorder_level: number;
  selling_price: number | string;
  is_archived: boolean;
  updated_at: string;
};

type InventoryTransactionRow = {
  id: string;
  product_id: string;
  transaction_type: "stock_in" | "stock_out" | "adjustment" | "archive" | "restore";
  quantity_delta: number;
  reason: string;
  created_at: string;
  inventory_products: {
    name: string;
  } | null;
};

type SaleRow = {
  id: string;
  product_id: string | null;
  product_name_snapshot: string;
  quantity: number;
  line_total: number | string;
  sale_mode: "linked" | "manual";
  sold_at: string;
};

const PRODUCT_SELECT =
  "id,sku,name,category_name,current_stock,reorder_level,selling_price,is_archived,updated_at";
const SALE_SELECT = "id,product_id,product_name_snapshot,quantity,line_total,sale_mode,sold_at";
const TRANSACTION_SELECT =
  "id,product_id,transaction_type,quantity_delta,reason,created_at,inventory_products(name)";

function assertDashboardDatabaseConfig() {
  if (!serverEnv.supabaseUrl || !serverEnv.supabaseServiceRoleKey) {
    throw new Error(
      "Dashboard requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local so the app can load summary data.",
    );
  }

  return {
    url: serverEnv.supabaseUrl,
    serviceRoleKey: serverEnv.supabaseServiceRoleKey,
  };
}

function toNumber(value: number | string) {
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

async function requestSupabase<T>(path: string, query: URLSearchParams) {
  const config = assertDashboardDatabaseConfig();
  const url = new URL(`/rest/v1/${path}`, config.url);
  url.search = query.toString();

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Supabase dashboard request failed with status ${response.status}${detail ? `: ${detail}` : "."}`,
    );
  }

  const text = await response.text();

  return text ? (JSON.parse(text) as T) : ([] as unknown as T);
}

function startOfTodayIso() {
  const value = new Date();
  value.setHours(0, 0, 0, 0);

  return value.toISOString();
}

function daysAgoIso(days: number) {
  const value = new Date();
  value.setHours(0, 0, 0, 0);
  value.setDate(value.getDate() - days);

  return value.toISOString();
}

function describeInventoryTransaction(row: InventoryTransactionRow) {
  const productName = row.inventory_products?.name ?? "Inventory item";

  switch (row.transaction_type) {
    case "stock_in":
      return {
        title: `${productName} restocked`,
        description: `${Math.abs(row.quantity_delta)} units added. ${row.reason}`,
        tone: "positive" as const,
      };
    case "stock_out":
      return {
        title: `${productName} stock moved out`,
        description: `${Math.abs(row.quantity_delta)} units removed. ${row.reason}`,
        tone: "warning" as const,
      };
    case "adjustment":
      return {
        title: `${productName} adjusted`,
        description: `${row.quantity_delta > 0 ? "+" : ""}${row.quantity_delta} units. ${row.reason}`,
        tone: "neutral" as const,
      };
    case "archive":
      return {
        title: `${productName} archived`,
        description: row.reason,
        tone: "neutral" as const,
      };
    case "restore":
      return {
        title: `${productName} restored`,
        description: row.reason,
        tone: "positive" as const,
      };
  }
}

function buildRecentActivity(
  sales: SaleRow[],
  transactions: InventoryTransactionRow[],
): DashboardActivityItem[] {
  const saleActivity: DashboardActivityItem[] = sales.map((sale) => ({
    id: `sale-${sale.id}`,
    happenedAt: sale.sold_at,
    type: "sale",
    title: `${sale.product_name_snapshot} sold`,
    description: `${sale.quantity} units via ${sale.sale_mode} sale for ${toNumber(sale.line_total).toFixed(2)} INR.`,
    href: `/sales/${sale.id}`,
    tone: sale.sale_mode === "linked" ? "positive" : "neutral",
  }));

  const inventoryActivity: DashboardActivityItem[] = transactions.map((transaction) => {
    const description = describeInventoryTransaction(transaction);

    return {
      id: `inventory-${transaction.id}`,
      happenedAt: transaction.created_at,
      type: "inventory",
      title: description.title,
      description: description.description,
      href: `/inventory/${transaction.product_id}`,
      tone: description.tone,
    };
  });

  return [...saleActivity, ...inventoryActivity]
    .sort((left, right) => new Date(right.happenedAt).getTime() - new Date(left.happenedAt).getTime())
    .slice(0, 8);
}

export async function getDashboardData(): Promise<DashboardData> {
  const todayIso = startOfTodayIso();
  const sevenDaysAgoIso = daysAgoIso(6);
  const fourteenDaysAgoIso = daysAgoIso(13);

  const [products, recentSalesWindow, todaySales, recentTransactions] = await Promise.all([
    requestSupabase<InventoryProductRow[]>(
      "inventory_products",
      new URLSearchParams({
        select: PRODUCT_SELECT,
        order: "updated_at.desc",
        limit: "500",
      }),
    ),
    requestSupabase<SaleRow[]>(
      "sales_entries",
      new URLSearchParams({
        select: SALE_SELECT,
        order: "sold_at.desc",
        sold_at: `gte.${fourteenDaysAgoIso}`,
        limit: "200",
      }),
    ),
    requestSupabase<SaleRow[]>(
      "sales_entries",
      new URLSearchParams({
        select: SALE_SELECT,
        order: "sold_at.desc",
        sold_at: `gte.${todayIso}`,
        limit: "100",
      }),
    ),
    requestSupabase<InventoryTransactionRow[]>(
      "inventory_transactions",
      new URLSearchParams({
        select: TRANSACTION_SELECT,
        order: "created_at.desc",
        limit: "16",
      }),
    ),
  ]);

  const activeProducts = products.filter((product) => !product.is_archived);
  const archivedProducts = products.length - activeProducts.length;
  const lowStockItems: DashboardLowStockItem[] = activeProducts
    .filter((product) => product.current_stock <= product.reorder_level)
    .sort((left, right) => {
      const leftGap = left.reorder_level - left.current_stock;
      const rightGap = right.reorder_level - right.current_stock;

      if (leftGap !== rightGap) {
        return rightGap - leftGap;
      }

      return left.current_stock - right.current_stock;
    })
    .slice(0, 6)
    .map((product) => ({
      id: product.id,
      sku: product.sku,
      name: product.name,
      categoryName: product.category_name,
      currentStock: product.current_stock,
      reorderLevel: product.reorder_level,
      gapToTarget: product.reorder_level - product.current_stock,
    }));

  const recentBoundary = new Date(sevenDaysAgoIso).getTime();
  const previousBoundary = new Date(fourteenDaysAgoIso).getTime();
  const last7DaysSales = recentSalesWindow.filter(
    (sale) => new Date(sale.sold_at).getTime() >= recentBoundary,
  );
  const previous7DaysSales = recentSalesWindow.filter((sale) => {
    const soldAt = new Date(sale.sold_at).getTime();

    return soldAt < recentBoundary && soldAt >= previousBoundary;
  });

  const recentSales: DashboardRecentSale[] = recentSalesWindow.slice(0, 5).map((sale) => ({
    id: sale.id,
    productName: sale.product_name_snapshot,
    saleMode: sale.sale_mode,
    quantity: sale.quantity,
    lineTotal: toNumber(sale.line_total),
    soldAt: sale.sold_at,
  }));

  const summary: DashboardSummary = {
    activeProducts: activeProducts.length,
    archivedProducts,
    totalUnitsInStock: activeProducts.reduce((sum, product) => sum + product.current_stock, 0),
    inventoryValueEstimate: activeProducts.reduce(
      (sum, product) => sum + product.current_stock * toNumber(product.selling_price),
      0,
    ),
    lowStockCount: activeProducts.filter((product) => product.current_stock <= product.reorder_level).length,
    todaySalesCount: todaySales.length,
    todayUnitsSold: todaySales.reduce((sum, sale) => sum + sale.quantity, 0),
    todayRevenue: todaySales.reduce((sum, sale) => sum + toNumber(sale.line_total), 0),
    last7DaysRevenue: last7DaysSales.reduce((sum, sale) => sum + toNumber(sale.line_total), 0),
    previous7DaysRevenue: previous7DaysSales.reduce((sum, sale) => sum + toNumber(sale.line_total), 0),
    last7DaysSalesCount: last7DaysSales.length,
  };

  return {
    summary,
    lowStockItems,
    recentSales,
    recentActivity: buildRecentActivity(recentSalesWindow.slice(0, 8), recentTransactions),
  };
}

