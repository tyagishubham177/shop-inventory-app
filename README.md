# Shop Inventory App

A mobile-first inventory and sales web app for a small internal shop team.

## Summary

This repository now includes the Phase 0 implementation scaffold on top of the blueprint docs.

The product is intended for 2 to 3 internal users, low scale, and fast daily mobile usage. The v1 scope stays focused on auth, inventory, sales, dashboard summaries, backup export, and read-only LLM chat over approved queries.

## Current stack

- Next.js with TypeScript
- Tailwind CSS
- Supabase Postgres as the hosted database
- Custom app-managed auth and sessions
- OpenAI API for the read-only chat flow
- Separate dev and prod environments from day 1

## Start here

1. Read [AGENTS.md](AGENTS.md)
2. Review [DECISIONS.md](DECISIONS.md)
3. Follow [TASKS.md](TASKS.md)
4. Use the docs in [docs/](docs)
5. Use the phase checklist in [Phase/phase0.md](Phase/phase0.md)

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

## Environment notes

- Keep real secrets only in `.env.local` for dev and in your deployment provider for prod.
- `NEXT_PUBLIC_APP_URL` is safe to expose to the browser.
- `SUPABASE_ANON_KEY` is also browser-safe when used as the public anon key.
- `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, and `SESSION_SECRET` must stay server-only.
- `.gitignore` already excludes local env files, so these values will not be committed unless someone force-adds them manually.

## Repo map

- `src/app/` holds the Next.js app routes and global styles.
- `src/components/` holds shared UI primitives for the app shell.
- `src/lib/` holds shared utilities like env helpers.
- `docs/` holds product, design, data, API, UI, deploy, test, backup, prompt, and seed guidance.
- `agents/` holds role-focused briefs.
- `Phase/` holds implementation checklists.

## Human verification for Phase 0

1. Confirm the app starts locally with `npm run dev`
2. Confirm the home page loads on mobile-width and desktop-width screens
3. Confirm the docs list in the app and repo README is easy to find
4. Confirm dev and prod environment separation is documented before Phase 1 work starts
