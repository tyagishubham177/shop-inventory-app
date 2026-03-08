# Backup and Restore

## v1 strategy

Use manual CSV export as the first backup mechanism.

## Export scope

- inventory products
- sales entries
- category master
- inventory transactions for audit history
- users if needed for admin backup

## Export workflow

- Admin opens the backup workspace at `/admin`.
- Each export downloads one CSV for a single dataset.
- The app writes a row to `backups_log` with export type, filename, status, and timestamp.
- Keep the users export protected because it includes password hashes for app-managed login recovery.

## Restore approach

- Restore is a guided admin operation, not an end-user feature.
- Import the CSV into a dev project or staging database first.
- Validate row counts, primary identifiers, and any foreign-key references before writing anything.
- Keep a record of when the restore happened, who performed it, and which export file was used.

## Guardrails

- Do not overwrite production blindly.
- Test restore flow in dev before prod use.
- Prefer additive restores or controlled admin scripts.
- Restore users only if you intentionally want to carry over password hashes and role assignments.
