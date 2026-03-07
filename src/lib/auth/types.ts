export type UserRole = "admin" | "staff" | "viewer";

export type UserSummary = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type StoredUser = UserSummary & {
  isActive: boolean;
  passwordHash: string;
};

export type SessionPayload = {
  sub: string;
  role: UserRole;
  email: string;
  name: string;
  iat: number;
  exp: number;
  version: 1;
};
