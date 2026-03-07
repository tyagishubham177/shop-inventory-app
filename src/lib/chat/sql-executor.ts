import { serverEnv } from "@/lib/env";

type ChatSqlRpcResponse = {
  rows?: Array<Record<string, unknown>>;
  rowCount?: number;
  truncated?: boolean;
};

export type ChatSqlExecutionResult = {
  rows: Array<Record<string, unknown>>;
  rowCount: number;
  truncated: boolean;
};

function assertChatSqlConfig() {
  if (!serverEnv.supabaseUrl || !serverEnv.supabaseServiceRoleKey) {
    throw new Error(
      "Chat SQL requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before the direct query path can run.",
    );
  }

  return {
    url: serverEnv.supabaseUrl,
    serviceRoleKey: serverEnv.supabaseServiceRoleKey,
  };
}

export async function executeChatReadOnlySql(sql: string, maxRows: number): Promise<ChatSqlExecutionResult> {
  const config = assertChatSqlConfig();
  const response = await fetch(`${config.url}/rest/v1/rpc/execute_chat_read_query`, {
    method: "POST",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query_text: sql,
      max_rows: maxRows,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Direct chat SQL failed with status ${response.status}${detail ? `: ${detail}` : "."}`,
    );
  }

  const payload = (await response.json().catch(() => null)) as ChatSqlRpcResponse | null;

  if (!payload || !Array.isArray(payload.rows)) {
    throw new Error("Direct chat SQL did not return a readable result set.");
  }

  return {
    rows: payload.rows,
    rowCount: typeof payload.rowCount === "number" ? payload.rowCount : payload.rows.length,
    truncated: payload.truncated === true,
  };
}