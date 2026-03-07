# Shop Inventory App

A mobile-first inventory and sales web app for a small internal shop team.

## Summary

This repository now includes the completed Phase 1 auth foundation, the Phase 2 schema migration baseline, and the first Supabase-backed user lookup for app-managed auth.

The product is intended for 2 to 3 internal users, low scale, and fast daily mobile usage. The v1 scope stays focused on auth, inventory, sales, dashboard summaries, backup export, and read-only LLM chat over approved queries.

## Current stack

- Next.js with TypeScript
- Tailwind CSS
- Supabase Postgres as the hosted database
- Custom app-managed auth and sessions
- OpenAI API for the read-only chat flow
- Separate dev and prod environments from day 1

## Current phase status

- Phase 0 scaffold is complete
- Phase 1 auth is complete with password verification, signed sessions, login and logout routes, middleware protection, and a mobile-first login page
- Phase 2 schema now has an initial migration for users, categories, inventory, sales, inventory transactions, chat logs, and backups
- Auth now checks the Supabase `users` table first and falls back to local demo users in development when `AUTH_ALLOW_DEV_DEMO_USERS` stays enabled
- Dev seed helpers now exist for starter users and category master data

## Start here

1. Read [AGENTS.md](AGENTS.md)
2. Review [DECISIONS.md](DECISIONS.md)
3. Follow [TASKS.md](TASKS.md)
4. Use the docs in [docs/](docs)
5. Use the phase checklist in [Phase/phase2.md](Phase/phase2.md)

## Local development

1. Install dependencies with `npm install`
2. Create `.env.local` from `.env.example`
3. Add your Supabase project URL and service role key to `.env.local`
4. Start the app with `npm run dev`
5. Open `http://localhost:3000`

## Scripts

- `npm run dev` starts the local app
- `npm run lint` runs ESLint
- `npm run typecheck` runs TypeScript checks
- `npm run build` verifies the production build

## Repo safety

- PRs into `master` run `lint`, `typecheck`, and `build` through GitHub Actions.
- Daily rollback tags are created on `master` as `rollback-YYYY-MM-DD`.
- Rollback tag cleanup keeps the newest 5 rollback tags even if they are old, then deletes older rollback tags once they are more than 7 days old.
- Force-push blocking and PR-only merge rules for `master` must be enabled in GitHub branch protection or rulesets.

## GitHub setup checklist

1. Open the repository on GitHub and go to `Settings` -> `Rules` -> `Rulesets` or `Branches`.
2. Create a rule for the `master` branch.
3. Enable `Require a pull request before merging`.
4. Enable `Require status checks to pass before merging`.
5. Mark these checks as required after the workflow runs once:
   - `lint`
   - `typecheck`
   - `build`
6. Enable `Require branches to be up to date before merging`.
7. Disable force pushes to `master`.
8. Disable branch deletion for `master`.
9. Apply the rule to admins too if you want the protection to cover all users.
10. In `Settings` -> `Actions` -> `General`, confirm workflows can create and push tags with `Read and write permissions`.

## Rollback operations

- `Rollback Tags` runs daily at `18:30 UTC`, which is `00:00 IST` the next day.
- `Rollback Tag Cleanup` runs after a successful daily rollback-tag run and can also be triggered manually.
- You can manually run either workflow from the GitHub `Actions` tab with `Run workflow`.
- The cleanup workflow only touches tags that start with `rollback-`.

## Environment notes

- Keep real secrets only in `.env.local` for dev and in your deployment provider for prod.
- `NEXT_PUBLIC_APP_URL` is safe to expose to the browser.
- `SUPABASE_ANON_KEY` is browser-safe when used as the public anon key.
- `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, and `SESSION_SECRET` must stay server-only.
- `SUPABASE_SERVICE_ROLE_KEY` is required for server-side user lookups against the app-managed `users` table.
- `AUTH_ALLOW_DEV_DEMO_USERS` is optional and only affects development fallback users.
- `.gitignore` already excludes local env files, so these values will not be committed unless someone force-adds them manually.

## Repo map

- `src/app/` holds the Next.js app routes and global styles.
- `src/components/` holds shared UI primitives for the app shell.
- `src/lib/` holds shared utilities like env helpers.
- `docs/` holds product, design, data, API, UI, deploy, test, backup, prompt, and seed guidance.
- `agents/` holds role-focused briefs.
- `Phase/` holds implementation checklists.
- `supabase/migrations/` holds the SQL migrations that should be applied to the Supabase database.
- `supabase/seed/` holds dev-only seed SQL helpers.

## Human verification for Phase 1

1. Start the app locally with `npm run dev`
2. Open `http://localhost:3000` and confirm you are redirected to `/login`
3. Sign in with the admin demo account shown on the login page and confirm the dashboard loads
4. Try an invalid password and confirm the login page shows a clear error
5. Sign in as the staff demo user and visit `/admin`, then confirm you are redirected back to `/` with an admin-only notice
6. Sign in as the admin demo user and visit `/admin`, then confirm the page opens
7. Use `Sign out` and confirm protected routes redirect back to `/login`

## Human verification for Phase 2 schema

1. Open your dev Supabase project and go to the SQL editor.
2. Run [supabase/migrations/20260307163500_phase2_initial_schema.sql](supabase/migrations/20260307163500_phase2_initial_schema.sql).
3. Open the table editor and confirm these tables exist: `users`, `category_master`, `inventory_products`, `sales_entries`, `inventory_transactions`, `chat_logs`, and `backups_log`.
4. Open the database indexes view and confirm indexes exist for email, SKU, category, `sold_at`, and `created_at` lookups.
5. Run [supabase/seed/20260307172000_dev_users.sql](supabase/seed/20260307172000_dev_users.sql) and confirm the starter users appear in `public.users`.
6. Run [supabase/seed/20260307174000_dev_categories.sql](supabase/seed/20260307174000_dev_categories.sql) and confirm the starter categories appear in `public.category_master`.

## Human verification for Phase 2 auth source

1. In `.env.local`, set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SESSION_SECRET`.
2. Start the app locally and sign in with `admin@local.shop` / `AdminPass123!`.
3. Confirm the dashboard loads and `/admin` still works for the admin user.
4. Set `AUTH_ALLOW_DEV_DEMO_USERS=false`, restart the app, and confirm the same login still works so you know the database path is active.