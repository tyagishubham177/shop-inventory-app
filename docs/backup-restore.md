# Backup and Restore

## v1 strategy

Use manual CSV export as the first backup mechanism.

## Export scope

- inventory products
- sales entries
- category master
- users if needed for admin backup
- optional audit tables if useful

## Restore approach

- Restore is a guided admin operation, not an end-user feature.
- Imported data should be validated before write.
- Keep a record of when the restore happened and who performed it.

## Guardrails

- Do not overwrite production blindly.
- Test restore flow in dev before prod use.
- Prefer additive restores or controlled admin scripts.
