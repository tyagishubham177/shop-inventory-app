export const BACKUP_EXPORT_OPTIONS = [
  {
    type: "inventory_products",
    label: "Inventory products",
    description: "Product catalog, pricing, stock levels, and archive flags.",
  },
  {
    type: "sales_entries",
    label: "Sales entries",
    description: "Saved linked and manual sale lines with timestamps and totals.",
  },
  {
    type: "category_master",
    label: "Category master",
    description: "Category list, sort order, and active states.",
  },
  {
    type: "inventory_transactions",
    label: "Inventory transactions",
    description: "Stock in, stock out, adjustment, archive, and restore history.",
  },
  {
    type: "users",
    label: "Users",
    description: "App-managed users including password hashes for admin recovery.",
  },
] as const;

export type BackupExportType = (typeof BACKUP_EXPORT_OPTIONS)[number]["type"];

export type BackupExportResult = {
  exportType: BackupExportType;
  fileName: string;
  fileLabel: string;
  csv: string;
  rowCount: number;
};

export type BackupLogEntry = {
  id: string;
  requestedBy: string;
  exportType: string;
  fileLabel: string;
  status: string;
  createdAt: string;
};
