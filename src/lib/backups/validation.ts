import { BACKUP_EXPORT_OPTIONS, type BackupExportType } from "@/lib/backups/types";

type BackupValidationSuccess<T> = {
  success: true;
  data: T;
};

type BackupValidationFailure = {
  success: false;
  errors: string[];
};

export type BackupValidationResult<T> = BackupValidationSuccess<T> | BackupValidationFailure;

const VALID_EXPORT_TYPES = new Set<BackupExportType>(BACKUP_EXPORT_OPTIONS.map((option) => option.type));

export function validateBackupExportInput(
  body: unknown,
): BackupValidationResult<{ exportType: BackupExportType }> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      success: false,
      errors: ["Send a JSON body with an exportType value."],
    };
  }

  const exportType = "exportType" in body ? body.exportType : undefined;

  if (typeof exportType !== "string" || !VALID_EXPORT_TYPES.has(exportType as BackupExportType)) {
    return {
      success: false,
      errors: [
        `Choose one of the supported export types: ${BACKUP_EXPORT_OPTIONS.map((option) => option.type).join(", ")}.`,
      ],
    };
  }

  return {
    success: true,
    data: {
      exportType: exportType as BackupExportType,
    },
  };
}
