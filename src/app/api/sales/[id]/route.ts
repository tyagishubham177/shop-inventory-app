import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { resolveCurrentUserFromSessionToken } from "@/lib/auth/user-context";
import { isUuidLike } from "@/lib/inventory/validation";
import { getSaleEntry, updateSaleEntry } from "@/lib/sales/data";
import { validateSaleUpsertInput } from "@/lib/sales/validation";

type SalesRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function getRequestUser() {
  const cookieStore = await cookies();

  return resolveCurrentUserFromSessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export async function GET(_request: Request, context: SalesRouteContext) {
  const user = await getRequestUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const { id } = await context.params;

  if (!isUuidLike(id)) {
    return NextResponse.json({ error: "Provide a valid sale entry id." }, { status: 400 });
  }

  try {
    const sale = await getSaleEntry(id);

    if (!sale) {
      return NextResponse.json({ error: "The sale entry was not found." }, { status: 404 });
    }

    return NextResponse.json({ sale });
  } catch (error) {
    console.error("Failed to load sale detail.", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Sales detail is temporarily unavailable.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: SalesRouteContext) {
  const user = await getRequestUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  if (user.role === "viewer") {
    return NextResponse.json(
      { error: "Your role can view sales but cannot change them." },
      { status: 403 },
    );
  }

  const { id } = await context.params;

  if (!isUuidLike(id)) {
    return NextResponse.json({ error: "Provide a valid sale entry id." }, { status: 400 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a valid JSON body." }, { status: 400 });
  }

  const validation = validateSaleUpsertInput(body);

  if (!validation.success) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  try {
    const sale = await updateSaleEntry(id, validation.data, user);

    return NextResponse.json({ sale });
  } catch (error) {
    console.error("Failed to update sale entry.", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Sale correction failed. Please retry.",
      },
      { status: 500 },
    );
  }
}
