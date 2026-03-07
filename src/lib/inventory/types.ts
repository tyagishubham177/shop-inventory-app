export type InventoryArchivedFilter = "active" | "archived" | "all";

export type InventoryCategoryOption = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
};

export type InventoryListFilters = {
  query: string;
  categoryId: string;
  brand: string;
  archived: InventoryArchivedFilter;
  lowStock: boolean;
  page: number;
  pageSize: number;
};

export type InventoryProduct = {
  id: string;
  sku: string;
  name: string;
  brand: string | null;
  categoryId: string;
  categoryName: string;
  size: string | null;
  color: string | null;
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  reorderLevel: number;
  location: string | null;
  notes: string | null;
  isArchived: boolean;
  isLowStock: boolean;
  createdAt: string;
  updatedAt: string;
};

export type InventoryTransactionType =
  | "stock_in"
  | "stock_out"
  | "adjustment"
  | "archive"
  | "restore";

export type InventoryTransaction = {
  id: string;
  productId: string;
  transactionType: InventoryTransactionType;
  quantityDelta: number;
  reason: string;
  performedBy: string;
  createdAt: string;
};

export type InventoryProductDetail = {
  product: InventoryProduct;
  recentTransactions: InventoryTransaction[];
};

export type InventoryListResult = {
  items: InventoryProduct[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type InventoryUpsertInput = {
  sku: string;
  name: string;
  brand: string | null;
  categoryId: string;
  size: string | null;
  color: string | null;
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  reorderLevel: number;
  location: string | null;
  notes: string | null;
  stockReason: string | null;
};

export type InventoryValidationResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      errors: string[];
    };
