import { cookies } from "next/headers";

import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { resolveCurrentUserFromSessionToken } from "@/lib/auth/user-context";
import { createBackupExport } from "@/lib/backups/data";
import { validateBackupExportInput } from "@/lib/backups/validation";

async function getRequestUser() {
  const cookieStore = await cookies();

  return resolveCurrentUserFromSessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export async function POST(request: Request) {
  const user = await getRequestUser();

  if (!user) {
    return Response.json({ error: "Authentication is required." }, { status: 401 });
  }

  if (user.role !== "admin") {
    return Response.json(
      { error: "Only admin users can export backup data." },
      { status: 403 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send a valid JSON body." }, { status: 400 });
  }

  const validation = validateBackupExportInput(body);

  if (!validation.success) {
    return Response.json({ errors: validation.errors }, { status: 400 });
  }

  try {
    const result = await createBackupExport(validation.data.exportType, user);

    return new Response(result.csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${result.fileName}"`,
        "X-Backup-Export-Type": result.exportType,
        "X-Backup-Row-Count": `${result.rowCount}`,
      },
    });
  } catch (error) {
    console.error("Failed to create backup export.", error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Backup export failed. Confirm the database connection and retry.",
      },
      { status: 500 },
    );
  }
}
