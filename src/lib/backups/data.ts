import type { UserSummary } from "@/lib/auth/types";
import type { BackupExportResult, BackupExportType, BackupLogEntry } from "@/lib/backups/types";
import { serverEnv } from "@/lib/env";
import { isUuidLike } from "@/lib/inventory/validation";

type BackupLogRow = {
  id: string;
  requested_by: string;
  export_type: string;
  file_label: string;
  status: string;
  created_at: string;
};

type BackupLogInsertRow = {
  requested_by: string;
  export_type: string;
  file_label: string;
  status: string;
};

type BackupExportDefinition = {
  fileLabelPrefix: string;
  select: string;
  order: string;
  columns: string[];
};

const BACKUP_LOG_SELECT = "id,requested_by,export_type,file_label,status,created_at";

const BACKUP_EXPORT_DEFINITIONS: Record<BackupExportType, BackupExportDefinition> = {
  inventory_products: {
    fileLabelPrefix: "inventory-products",
    select:
      "id,sku,name,brand,category_id,category_name,size,color,purchase_price,selling_price,current_stock,reorder_level,location,notes,is_archived,created_at,updated_at",
    order: "updated_at.desc",
    columns: [
      "id",
      "sku",
      "name",
      "brand",
      "category_id",
      "category_name",
      "size",
      "color",
      "purchase_price",
      "selling_price",
      "current_stock",
      "reorder_level",
      "location",
      "notes",
      "is_archived",
      "created_at",
      "updated_at",
    ],
  },
  sales_entries: {
    fileLabelPrefix: "sales-entries",
    select:
      "id,product_id,product_name_snapshot,category_name_snapshot,brand_snapshot,size_snapshot,color_snapshot,quantity,unit_price,line_total,sale_mode,sold_at,created_by,notes",
    order: "sold_at.desc",
    columns: [
      "id",
      "product_id",
      "product_name_snapshot",
      "category_name_snapshot",
      "brand_snapshot",
      "size_snapshot",
      "color_snapshot",
      "quantity",
      "unit_price",
      "line_total",
      "sale_mode",
      "sold_at",
      "created_by",
      "notes",
    ],
  },
  category_master: {
    fileLabelPrefix: "category-master",
    select: "id,name,slug,is_active,sort_order,created_at,updated_at",
    order: "sort_order.asc,name.asc",
    columns: ["id", "name", "slug", "is_active", "sort_order", "created_at", "updated_at"],
  },
  inventory_transactions: {
    fileLabelPrefix: "inventory-transactions",
    select: "id,product_id,transaction_type,quantity_delta,reason,performed_by,created_at",
    order: "created_at.desc",
    columns: [
      "id",
      "product_id",
      "transaction_type",
      "quantity_delta",
      "reason",
      "performed_by",
      "created_at",
    ],
  },
  users: {
    fileLabelPrefix: "users",
    select: "id,name,email,password_hash,role,is_active,created_at,updated_at",
    order: "created_at.desc",
    columns: ["id", "name", "email", "password_hash", "role", "is_active", "created_at", "updated_at"],
  },
};

function assertBackupsDatabaseConfig() {
  if (!serverEnv.supabaseUrl || !serverEnv.supabaseServiceRoleKey) {
    throw new Error(
      "Backup export requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local so the app can read data and record backup logs.",
    );
  }

  return {
    url: serverEnv.supabaseUrl,
    serviceRoleKey: serverEnv.supabaseServiceRoleKey,
  };
}

function ensureBackupActor(user: UserSummary) {
  if (!isUuidLike(user.id)) {
    throw new Error(
      "Backup export requires a database-backed admin user. Seed the dev users in Supabase, sign in again, and retry the export.",
    );
  }

  return user.id;
}

function mapBackupLog(row: BackupLogRow): BackupLogEntry {
  return {
    id: row.id,
    requestedBy: row.requested_by,
    exportType: row.export_type,
    fileLabel: row.file_label,
    status: row.status,
    createdAt: row.created_at,
  };
}

function createFileStamp(date = new Date()) {
  return date.toISOString().replace(/:/g, "-").replace(/\.\d{3}Z$/, "Z");
}

function escapeCsvValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  const normalized =
    typeof value === "string"
      ? value
      : typeof value === "number" || typeof value === "boolean"
        ? String(value)
        : JSON.stringify(value);

  if (/[",\r\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }

  return normalized;
}

function rowsToCsv(rows: Record<string, unknown>[], columns: string[]) {
  const header = columns.join(",");
  const lines = rows.map((row) => columns.map((column) => escapeCsvValue(row[column])).join(","));

  return [header, ...lines].join("\r\n");
}

async function requestSupabase<T>(
  path: string,
  options?: {
    method?: "GET" | "POST";
    body?: unknown;
    prefer?: string;
    query?: URLSearchParams;
  },
) {
  const config = assertBackupsDatabaseConfig();
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
      `Supabase backup request failed with status ${response.status}${detail ? `: ${detail}` : "."}`,
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

async function insertBackupLog(input: BackupLogInsertRow) {
  await requestSupabase<BackupLogRow[]>("backups_log", {
    method: "POST",
    prefer: "return=minimal",
    body: {
      requested_by: input.requested_by,
      export_type: input.export_type,
      file_label: input.file_label,
      status: input.status,
    },
  });
}

export async function listBackupExports(limit = 8): Promise<BackupLogEntry[]> {
  const query = new URLSearchParams({
    select: BACKUP_LOG_SELECT,
    order: "created_at.desc",
    limit: `${Math.max(1, Math.min(limit, 25))}`,
  });

  const { data } = await requestSupabase<BackupLogRow[]>("backups_log", {
    query,
  });

  return data.map(mapBackupLog);
}

export async function createBackupExport(
  exportType: BackupExportType,
  user: UserSummary,
): Promise<BackupExportResult> {
  const actorId = ensureBackupActor(user);
  const definition = BACKUP_EXPORT_DEFINITIONS[exportType];
  const timestamp = createFileStamp();
  const fileLabel = `${definition.fileLabelPrefix}-${timestamp}.csv`;

  try {
    const query = new URLSearchParams({
      select: definition.select,
      order: definition.order,
      limit: "5000",
    });

    const { data } = await requestSupabase<Record<string, unknown>[]>(exportType, {
      query,
    });
    const csv = rowsToCsv(data, definition.columns);

    await insertBackupLog({
      requested_by: actorId,
      export_type: exportType,
      file_label: fileLabel,
      status: "completed",
    });

    return {
      exportType,
      fileName: fileLabel,
      fileLabel,
      csv,
      rowCount: data.length,
    };
  } catch (error) {
    try {
      await insertBackupLog({
        requested_by: actorId,
        export_type: exportType,
        file_label: fileLabel,
        status: "failed",
      });
    } catch (logError) {
      console.error("Failed to log backup export failure.", logError);
    }

    throw error;
  }
}
