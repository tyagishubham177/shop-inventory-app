import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { resolveCurrentUserFromSessionToken } from "@/lib/auth/user-context";

const LOGIN_PATH = "/login";
const HOME_PATH = "/";

function buildLoginRedirect(request: NextRequest) {
  const loginUrl = new URL(LOGIN_PATH, request.url);
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  if (nextPath && nextPath !== LOGIN_PATH) {
    loginUrl.searchParams.set("next", nextPath);
  }

  return NextResponse.redirect(loginUrl);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const user = await resolveCurrentUserFromSessionToken(
    request.cookies.get(SESSION_COOKIE_NAME)?.value,
  );

  if (pathname === LOGIN_PATH) {
    if (user) {
      return NextResponse.redirect(new URL(HOME_PATH, request.url));
    }

    return NextResponse.next();
  }

  if (!user) {
    return buildLoginRedirect(request);
  }

  if (pathname.startsWith("/admin") && user.role !== "admin") {
    const homeUrl = new URL(HOME_PATH, request.url);
    homeUrl.searchParams.set("notice", "admin-only");

    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
