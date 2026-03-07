# Shop Inventory App

A mobile-first inventory and sales web app for a small internal shop team.

## Summary

This repo is the project blueprint extracted from the design PDF.

The product is intended for 2 to 3 internal users, low scale, and fast daily mobile usage. Phase 1 focuses on a clean operational core: auth, inventory, sales, dashboard summaries, backup export, and read-only LLM chat over approved queries.

## Proposed stack

- Next.js with TypeScript
- Tailwind CSS with shadcn/ui components
- Supabase Postgres as the hosted database
- Custom app-managed auth and sessions for internal users
- OpenAI Responses API for intent parsing and response generation
- Dev and prod environments from day 1

## Start here

- Read [AGENTS.md](AGENTS.md)
- Review [DECISIONS.md](DECISIONS.md)
- Follow [TASKS.md](TASKS.md)
- Use the docs in [docs/](docs)
- Use the detailed phase checklists in [Phase/](Phase)

## Repo map

- `docs/` holds product, design, data, API, UI, deploy, test, backup, prompt, and seed guidance.
- `agents/` holds role-focused briefs extracted from the PDF.
- `.github/` holds optional Copilot-specific instructions.
- `Phase/` holds implementation-phase checklists for build execution.

## Keys and secrets expected later

App runtime secrets:
- `NEXT_PUBLIC_APP_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `SESSION_SECRET`

Platform and deployment access:
- GitHub repo access to push branches and merge changes
- Supabase project access for dev and prod
- OpenAI API access for the chat feature
- Vercel or Cloudflare access for deployment when we start implementation

## Working style

You are the human tester. Codex owns implementation. We keep docs as the source of truth, build phase by phase, and validate each phase before moving ahead.
