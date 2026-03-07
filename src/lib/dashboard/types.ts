export type DashboardSummary = {
  activeProducts: number;
  archivedProducts: number;
  totalUnitsInStock: number;
  inventoryValueEstimate: number;
  lowStockCount: number;
  todaySalesCount: number;
  todayUnitsSold: number;
  todayRevenue: number;
  last7DaysRevenue: number;
  previous7DaysRevenue: number;
  last7DaysSalesCount: number;
};

export type DashboardLowStockItem = {
  id: string;
  sku: string;
  name: string;
  categoryName: string;
  currentStock: number;
  reorderLevel: number;
  gapToTarget: number;
};

export type DashboardRecentSale = {
  id: string;
  productName: string;
  saleMode: "linked" | "manual";
  quantity: number;
  lineTotal: number;
  soldAt: string;
};

export type DashboardActivityItem = {
  id: string;
  happenedAt: string;
  type: "sale" | "inventory";
  title: string;
  description: string;
  href: string;
  tone: "positive" | "neutral" | "warning";
};

export type DashboardData = {
  summary: DashboardSummary;
  lowStockItems: DashboardLowStockItem[];
  recentSales: DashboardRecentSale[];
  recentActivity: DashboardActivityItem[];
};

