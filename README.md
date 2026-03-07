# Shop Inventory App

A mobile-first inventory and sales web app for a small internal shop team.

## Summary

This repository now includes the Phase 1 auth implementation on top of the blueprint docs.

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
- Phase 1 auth is implemented with password verification, signed sessions, login and logout routes, middleware protection, and a mobile-first login page
- Until the real `users` table is added in Phase 2, local development uses temporary demo users only when `NODE_ENV` is not `production`

## Start here

1. Read [AGENTS.md](AGENTS.md)
2. Review [DECISIONS.md](DECISIONS.md)
3. Follow [TASKS.md](TASKS.md)
4. Use the docs in [docs/](docs)
5. Use the phase checklist in [Phase/phase1.md](Phase/phase1.md)

## Local development

1. Install dependencies with `npm install`
2. Create `.env.local` from `.env.example`
3. Start the app with `npm run dev`
4. Open `http://localhost:3000`

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
- `SUPABASE_ANON_KEY` is also browser-safe when used as the public anon key.
- `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, and `SESSION_SECRET` must stay server-only.
- `AUTH_ALLOW_DEV_DEMO_USERS` is optional and only affects local Phase 1 demo accounts.
- `.gitignore` already excludes local env files, so these values will not be committed unless someone force-adds them manually.

## Repo map

- `src/app/` holds the Next.js app routes and global styles.
- `src/components/` holds shared UI primitives for the app shell.
- `src/lib/` holds shared utilities like env helpers.
- `docs/` holds product, design, data, API, UI, deploy, test, backup, prompt, and seed guidance.
- `agents/` holds role-focused briefs.
- `Phase/` holds implementation checklists.

## Human verification for Phase 1

1. Start the app locally with `npm run dev`
2. Open `http://localhost:3000` and confirm you are redirected to `/login`
3. Sign in with the admin demo account shown on the login page and confirm the dashboard loads
4. Try an invalid password and confirm the login page shows a clear error
5. Sign in as the staff demo user and visit `/admin`, then confirm you are redirected back to `/` with an admin-only notice
6. Sign in as the admin demo user and visit `/admin`, then confirm the page opens
7. Use `Sign out` and confirm protected routes redirect back to `/login`
