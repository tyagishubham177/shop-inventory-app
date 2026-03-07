const BANNED_SQL_RULES = [
  {
    pattern: /(--|\/\*|\*\/)/i,
    message: "SQL comments are not allowed in chat queries.",
  },
  {
    pattern:
      /\b(insert|update|delete|merge|upsert|alter|drop|truncate|grant|revoke|create|replace|comment|copy|call|do|execute|prepare|deallocate|discard|vacuum|analyze|refresh|notify|listen|unlisten)\b/i,
    message: "Chat queries must stay read-only.",
  },
  {
    pattern: /\b(pg_sleep|information_schema|pg_catalog|pg_toast)\b/i,
    message: "System catalogs and blocking functions are not allowed in chat queries.",
  },
];

type ChatSqlValidationResult =
  | {
      success: true;
      data: string;
    }
  | {
      success: false;
      error: string;
    };

export function stripSqlFences(value: string) {
  return value.replace(/^```(?:sql|postgresql)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

export function normalizeGeneratedSql(value: string) {
  return stripSqlFences(value).replace(/;\s*$/, "").trim();
}

export function validateGeneratedSql(value: string): ChatSqlValidationResult {
  const normalized = normalizeGeneratedSql(value);

  if (!normalized) {
    return {
      success: false,
      error: "Chat SQL cannot be empty.",
    };
  }

  if (normalized.includes(";")) {
    return {
      success: false,
      error: "Only a single SQL statement is allowed.",
    };
  }

  if (!/^\s*(select|with)\b/i.test(normalized)) {
    return {
      success: false,
      error: "Chat SQL must start with SELECT or WITH.",
    };
  }

  for (const rule of BANNED_SQL_RULES) {
    if (rule.pattern.test(normalized)) {
      return {
        success: false,
        error: rule.message,
      };
    }
  }

  return {
    success: true,
    data: normalized,
  };
}