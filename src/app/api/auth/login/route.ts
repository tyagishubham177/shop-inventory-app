import { NextResponse } from "next/server";

import { verifyPassword } from "@/lib/auth/password";
import { clearRateLimit, takeRateLimitHit } from "@/lib/auth/rate-limit";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { getUserByEmail } from "@/lib/auth/users";

type LoginRequestBody = {
  email?: unknown;
  password?: unknown;
};

function getClientAddress(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizePassword(value: unknown) {
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  let body: LoginRequestBody;

  try {
    body = (await request.json()) as LoginRequestBody;
  } catch {
    return NextResponse.json({ error: "Send a valid JSON body." }, { status: 400 });
  }

  const email = normalizeEmail(body.email);
  const password = normalizePassword(body.password);

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const rateLimitKey = `${getClientAddress(request)}:${email}`;
  const rateLimit = takeRateLimitHit(rateLimitKey, 5, 10 * 60 * 1000);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Too many login attempts. Please wait a few minutes and try again.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  const user = getUserByEmail(email);

  if (!user || !user.isActive) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);

  if (!passwordMatches) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  clearRateLimit(rateLimitKey);

  const sessionToken = await createSessionToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  const response = NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });

  setSessionCookie(response, sessionToken);

  return response;
}
