export type SalesMode = "linked" | "manual";

export type SalesListFilters = {
  query: string;
  category: string;
  brand: string;
  mode: "all" | SalesMode;
  dateFrom: string;
  dateTo: string;
  page: number;
  pageSize: number;
};

export type SaleEntry = {
  id: string;
  productId: string | null;
  productNameSnapshot: string;
  categoryNameSnapshot: string | null;
  brandSnapshot: string | null;
  sizeSnapshot: string | null;
  colorSnapshot: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  saleMode: SalesMode;
  soldAt: string;
  createdBy: string;
  notes: string | null;
};

export type SalesProductOption = {
  id: string;
  sku: string;
  name: string;
  brand: string | null;
  categoryName: string;
  size: string | null;
  color: string | null;
  currentStock: number;
  sellingPrice: number;
};

export type SalesListResult = {
  items: SaleEntry[];
  total: number;
  totalQuantity: number;
  totalRevenue: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type SaleUpsertInput = {
  saleMode: SalesMode;
  productId: string | null;
  productName: string | null;
  categoryName: string | null;
  brand: string | null;
  size: string | null;
  color: string | null;
  quantity: number;
  unitPrice: number;
  soldAt: string;
  notes: string | null;
};

export type SalesValidationResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      errors: string[];
    };
