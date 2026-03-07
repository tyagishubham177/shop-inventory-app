# AGENTS.md

This repository is optimized for Codex-first development.

## Source of truth order

1. `DECISIONS.md`
2. `docs/design.md`
3. `docs/schema.md`
4. `docs/llm-design.md`
5. `docs/api-contracts.md`
6. `docs/ui-spec.md`
7. `TASKS.md`
8. `Phase/*.md`

If files disagree, follow the higher item in this list and update lower files to match.

## Product boundaries

- Build a mobile-first web app, not a native app.
- Keep the scale small and internal-user focused.
- Support inventory, sales, dashboard summaries, backup export, and read-only LLM chat.
- Do not add billing, barcode scanning, multi-shop support, image uploads, or LLM write actions in v1.

## Architecture guardrails

- Use Next.js and TypeScript.
- Use Supabase Postgres for storage.
- Use custom app-managed auth with role checks.
- Keep chat read-only even when it generates SQL.
- Route chat SQL only through approved read-only views and a low-privilege execution layer.
- Prefer simple server routes and explicit validation.

## Working rules for agents

- Update docs when architecture or scope changes.
- Keep changes phase-scoped.
- Favor boring, testable code over clever abstractions.
- Add comments only where logic is not obvious.
- Call out blockers early, especially auth, env, or deployment blockers.

## Human collaboration

- The human partner will provide keys, platform access, and manual verification.
- Every major phase should include a short manual test checklist.
- Keep dev and prod configuration separate from the start.

## Do not break these

- Do not allow chat to create, update, archive, restore, or delete records.
- Do not bypass role checks.
- Do not introduce image uploads in v1.
- Do not expose unrestricted database access from the client.
- Do not add unnecessary infrastructure such as Docker or local Postgres unless explicitly approved.