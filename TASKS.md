# TASKS.md

## Phase 0: bootstrap [done]

- Initialize the Next.js app with TypeScript and Tailwind.
- Add base UI primitives and app shell.
- Add `.env.example`.
- Add links to docs in `README.md`.
- Confirm dev and prod environment separation.

## Phase 1: auth [done]

- Create password hash and verify helpers.
- Create session sign and verify helpers.
- Create current-user resolver.
- Add login and logout routes.
- Add route protection middleware.
- Build the login page.

## Phase 2: schema [done]

- Create migrations for users.
- Create migrations for category master.
- Create migrations for inventory products.
- Create migrations for sales entries.
- Create migrations for inventory transactions.
- Create migrations for chat logs.
- Create migrations for backup logs.

## Phase 3: inventory [done]

- Add inventory validation.
- Add inventory query helpers.
- Add inventory API routes.
- Build inventory list and create/edit screens.
- Add archive and restore support.

## Phase 4: sales [current]

- Add sales validation.
- Add sales query helpers.
- Add sales API routes.
- Build sales list and create/edit screens.
- Support manual and linked sales entry.

## Phase 5: dashboard

- Build summary cards.
- Add low-stock indicators.
- Add recent activity view.
- Add simple trend snapshots.

## Phase 6: chat

- Define supported intents.
- Build intent parsing.
- Build query mapping.
- Build response generation.
- Add read-only chat API route and page.

## Phase 7: backups

- Add CSV export helpers.
- Add backup export route.
- Log backup actions.
- Document restore flow.

## Definition of done for each phase

- Docs updated if behavior changed.
- Manual verification steps written.
- No contradiction with `DECISIONS.md`.
- Ready for human testing.
