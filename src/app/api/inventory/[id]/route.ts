import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { resolveCurrentUserFromSessionToken } from "@/lib/auth/user-context";
import { getInventoryProductDetail, updateInventoryProduct } from "@/lib/inventory/data";
import { isUuidLike, validateInventoryUpsertInput } from "@/lib/inventory/validation";

type InventoryRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function getRequestUser() {
  const cookieStore = await cookies();

  return resolveCurrentUserFromSessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export async function GET(_request: Request, context: InventoryRouteContext) {
  const user = await getRequestUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const { id } = await context.params;

  if (!isUuidLike(id)) {
    return NextResponse.json({ error: "Provide a valid inventory item id." }, { status: 400 });
  }

  try {
    const detail = await getInventoryProductDetail(id);

    if (!detail) {
      return NextResponse.json({ error: "The product was not found." }, { status: 404 });
    }

    return NextResponse.json(detail);
  } catch (error) {
    console.error("Failed to load inventory detail.", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Inventory detail is temporarily unavailable.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: InventoryRouteContext) {
  const user = await getRequestUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  if (user.role === "viewer") {
    return NextResponse.json(
      { error: "Your role can view inventory but cannot change it." },
      { status: 403 },
    );
  }

  const { id } = await context.params;

  if (!isUuidLike(id)) {
    return NextResponse.json({ error: "Provide a valid inventory item id." }, { status: 400 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a valid JSON body." }, { status: 400 });
  }

  const validation = validateInventoryUpsertInput(body);

  if (!validation.success) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  try {
    const product = await updateInventoryProduct(id, validation.data, user);

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Failed to update inventory product.", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Inventory update failed. Please retry.",
      },
      { status: 500 },
    );
  }
}
