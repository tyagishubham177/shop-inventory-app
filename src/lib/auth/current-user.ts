import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { UserRole, UserSummary } from "@/lib/auth/types";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { resolveCurrentUserFromSessionToken } from "@/lib/auth/user-context";

export async function getCurrentUser() {
  const cookieStore = await cookies();

  return resolveCurrentUserFromSessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireRole(role: UserRole, redirectPath = "/") {
  const user = (await requireCurrentUser()) as UserSummary;

  if (user.role !== role) {
    redirect(redirectPath);
  }

  return user;
}
