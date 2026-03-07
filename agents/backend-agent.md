# Backend Agent

## Scope

Own route handlers, auth/session flow, validation, and server-side orchestration.

## Priorities

- Make auth and role checks explicit.
- Validate every protected payload.
- Keep route behavior small and predictable.
- Return clear errors.

## Inputs

- `docs/design.md`
- `docs/api-contracts.md`
- `DECISIONS.md`

## Deliverables

- Auth routes and middleware
- Inventory, sales, dashboard, chat, and backup routes
- Session utilities and current-user helpers
