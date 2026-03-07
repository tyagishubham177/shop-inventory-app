import { serverEnv } from "@/lib/env";
import type { StoredUser } from "@/lib/auth/types";

type DemoCredential = {
  email: string;
  password: string;
  role: StoredUser["role"];
};

type DatabaseUserRow = {
  id: string;
  name: string;
  email: string;
  role: StoredUser["role"];
  is_active: boolean;
  password_hash: string;
};

const DEMO_CREDENTIALS: DemoCredential[] = [
  {
    email: "admin@local.shop",
    password: "AdminPass123!",
    role: "admin",
  },
  {
    email: "staff@local.shop",
    password: "StaffPass123!",
    role: "staff",
  },
  {
    email: "viewer@local.shop",
    password: "ViewerPass123!",
    role: "viewer",
  },
];

const DEMO_USERS: StoredUser[] = [
  {
    id: "demo-admin",
    name: "Asha Admin",
    email: "admin@local.shop",
    role: "admin",
    isActive: true,
    passwordHash:
      "scrypt$cc6C4DEhlFsEpF31KTDu3g$gvWrPzKf5b0Rre_nVjJpt8bf5tRzQuLbPcK5Kk_4Q9A5HzlvjswcmNDUxQhAmWnRVG7wDCFwIc3oj_2tmDZEEg",
  },
  {
    id: "demo-staff",
    name: "Samar Staff",
    email: "staff@local.shop",
    role: "staff",
    isActive: true,
    passwordHash:
      "scrypt$lcOQjfrqRgagpX_j6qY0Gg$Efmygw9qJcrEeguJ_iexX6T4dNWJFSFGbnj9bvZtbf7_9q0otXWqn6d8wqauNwbhntjULPDOGpsie4oyExx6ng",
  },
  {
    id: "demo-viewer",
    name: "Vani Viewer",
    email: "viewer@local.shop",
    role: "viewer",
    isActive: true,
    passwordHash:
      "scrypt$hSnlfOZ6uyGEdJj63hJ2mA$AL4u-OIfgP7nLCLmNMXR-zW4FHntDkWUc2eEX7dUvUCn4N7AT_nWr2MVgEuTJJBtm36OVwD6oP7OyMh8DV7o8g",
  },
];

const USERS_SELECT = "id,name,email,role,is_active,password_hash";

export function areDevDemoUsersEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.AUTH_ALLOW_DEV_DEMO_USERS !== "false";
}

function isSupabaseAuthConfigured() {
  return Boolean(serverEnv.supabaseUrl && serverEnv.supabaseServiceRoleKey);
}

function findDemoUserByEmail(email: string) {
  return DEMO_USERS.find((user) => user.email === email) ?? null;
}

function findDemoUserById(id: string) {
  return DEMO_USERS.find((user) => user.id === id) ?? null;
}

function mapDatabaseUser(row: DatabaseUserRow): StoredUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    isActive: row.is_active,
    passwordHash: row.password_hash,
  };
}

async function fetchDatabaseUsers(params: URLSearchParams) {
  if (!isSupabaseAuthConfigured()) {
    return [] as DatabaseUserRow[];
  }

  const response = await fetch(`${serverEnv.supabaseUrl}/rest/v1/users?${params.toString()}`, {
    method: "GET",
    headers: {
      apikey: serverEnv.supabaseServiceRoleKey as string,
      Authorization: `Bearer ${serverEnv.supabaseServiceRoleKey}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Supabase users lookup failed with status ${response.status}.`);
  }

  return (await response.json()) as DatabaseUserRow[];
}

async function getDatabaseUserByEmail(email: string) {
  if (!isSupabaseAuthConfigured()) {
    return null;
  }

  const params = new URLSearchParams({
    select: USERS_SELECT,
    email: `eq.${email}`,
    limit: "1",
  });

  const [row] = await fetchDatabaseUsers(params);

  return row ? mapDatabaseUser(row) : null;
}

async function getDatabaseUserById(id: string) {
  if (!isSupabaseAuthConfigured()) {
    return null;
  }

  const params = new URLSearchParams({
    select: USERS_SELECT,
    id: `eq.${id}`,
    limit: "1",
  });

  const [row] = await fetchDatabaseUsers(params);

  return row ? mapDatabaseUser(row) : null;
}

export async function getUserByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return null;
  }

  try {
    const databaseUser = await getDatabaseUserByEmail(normalizedEmail);

    if (databaseUser) {
      return databaseUser;
    }
  } catch (error) {
    if (!areDevDemoUsersEnabled()) {
      throw error;
    }

    console.warn("Falling back to dev demo users because the Supabase email lookup failed.", error);
  }

  return findDemoUserByEmail(normalizedEmail);
}

export async function getUserById(id: string) {
  if (!id) {
    return null;
  }

  try {
    const databaseUser = await getDatabaseUserById(id);

    if (databaseUser) {
      return databaseUser;
    }
  } catch (error) {
    if (!areDevDemoUsersEnabled()) {
      return null;
    }

    console.warn("Falling back to dev demo users because the Supabase session lookup failed.", error);
  }

  return findDemoUserById(id);
}

export function getPhaseOneDemoCredentials() {
  if (!areDevDemoUsersEnabled()) {
    return [];
  }

  return DEMO_CREDENTIALS;
}