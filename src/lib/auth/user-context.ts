import type { UserSummary } from "@/lib/auth/types";
import { verifySessionToken } from "@/lib/auth/session";
import { getUserById } from "@/lib/auth/users";

export async function resolveCurrentUserFromSessionToken(token?: string | null): Promise<UserSummary | null> {
  const payload = await verifySessionToken(token);

  if (!payload) {
    return null;
  }

  const user = getUserById(payload.sub);

  if (!user || !user.isActive) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
