import type { StoredUser } from "@/lib/auth/types";

type DemoCredential = {
  email: string;
  password: string;
  role: StoredUser["role"];
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

export function areDevDemoUsersEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.AUTH_ALLOW_DEV_DEMO_USERS !== "false";
}

export function getUserByEmail(email: string) {
  if (!areDevDemoUsersEnabled()) {
    return null;
  }

  const normalizedEmail = email.trim().toLowerCase();

  return DEMO_USERS.find((user) => user.email === normalizedEmail) ?? null;
}

export function getUserById(id: string) {
  if (!areDevDemoUsersEnabled()) {
    return null;
  }

  return DEMO_USERS.find((user) => user.id === id) ?? null;
}

export function getPhaseOneDemoCredentials() {
  if (!areDevDemoUsersEnabled()) {
    return [];
  }

  return DEMO_CREDENTIALS;
}
