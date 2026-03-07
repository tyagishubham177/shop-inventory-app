import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { resolveCurrentUserFromSessionToken } from "@/lib/auth/user-context";
import { createSalesEntries, listSalesEntries } from "@/lib/sales/data";
import { parseSalesListFilters, validateSalesCreateInput } from "@/lib/sales/validation";

async function getRequestUser() {
  const cookieStore = await cookies();

  return resolveCurrentUserFromSessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export async function GET(request: Request) {
  const user = await getRequestUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  try {
    const filters = parseSalesListFilters(new URL(request.url).searchParams);
    const result = await listSalesEntries(filters);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to load sales list.", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Sales list is temporarily unavailable.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
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

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a valid JSON body." }, { status: 400 });
  }

  const validation = validateSalesCreateInput(body);

  if (!validation.success) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  try {
    const sales = await createSalesEntries(validation.data, user);

    return NextResponse.json(
      {
        sale: sales[0],
        sales,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create sales entry.", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Sales entry creation failed. Please retry.",
      },
      { status: 500 },
    );
  }
}
