import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

import { takeRateLimitHit } from "@/lib/auth/rate-limit";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { resolveCurrentUserFromSessionToken } from "@/lib/auth/user-context";
import { runFlexibleChatQuery } from "@/lib/chat/flexible-service";
import { validateChatQueryInput } from "@/lib/chat/validation";

async function getRequestUser() {
  const cookieStore = await cookies();

  return resolveCurrentUserFromSessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export async function POST(request: Request) {
  const user = await getRequestUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const headerStore = await headers();
  const ipAddress = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rateLimitKey = `chat:${user.id}:${ipAddress}`;
  const rateLimit = takeRateLimitHit(rateLimitKey, 12, 60_000);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: `Too many chat requests. Please retry in about ${rateLimit.retryAfterSeconds} seconds.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": `${rateLimit.retryAfterSeconds}`,
        },
      },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a valid JSON body." }, { status: 400 });
  }

  const validation = validateChatQueryInput(body);

  if (!validation.success) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  try {
    const result = await runFlexibleChatQuery(validation.data.question, user);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to answer chat query.", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Chat is temporarily unavailable. Please retry after checking the database and OpenAI setup.",
      },
      { status: 500 },
    );
  }
}