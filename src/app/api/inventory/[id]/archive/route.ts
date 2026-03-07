import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { resolveCurrentUserFromSessionToken } from "@/lib/auth/user-context";
import { archiveInventoryProduct } from "@/lib/inventory/data";
import { isUuidLike } from "@/lib/inventory/validation";

type InventoryArchiveRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function getRequestUser() {
  const cookieStore = await cookies();

  return resolveCurrentUserFromSessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export async function POST(_request: Request, context: InventoryArchiveRouteContext) {
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

  try {
    const product = await archiveInventoryProduct(id, user);

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Failed to archive inventory product.", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "The product could not be archived.",
      },
      { status: 500 },
    );
  }
}
