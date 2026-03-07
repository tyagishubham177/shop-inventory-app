# Decisions

This file records the project decisions that should not drift quietly over time.

## D-001: Mobile-first web app

Decision:
Use a mobile-first web app rather than native mobile apps.

Why:
- Fastest build path with Codex
- Easiest internal distribution
- Best fit for low-scale usage

Consequence:
Every screen must work cleanly on narrow touch screens.

## D-002: Next.js with TypeScript

Decision:
Use Next.js and TypeScript for UI and server routes.

Why:
- Strong ecosystem
- Good fit for web-first delivery
- Good tooling support

Consequence:
Server and client responsibilities must stay clearly separated.

## D-003: Supabase Postgres for storage

Decision:
Use Supabase Postgres as the hosted database.

Why:
- Simple managed Postgres setup
- Enough free-tier capacity for the target scale
- Clean fit for this app's data shape

Consequence:
Schema, migrations, and access control should be documented early.

## D-004: Custom app-managed auth

Decision:
Use app-managed users, passwords, and sessions instead of relying on Supabase Auth flows.

Why:
- The app is for a tiny internal team
- Admin-created users fit better than public signup flows
- Codex implementation is simpler when auth rules are explicit

Consequence:
We need secure password hashing, signed sessions, middleware, and role checks.

## D-005: Read-only LLM chat

Decision:
The LLM feature is read-only in v1.

Why:
- Lower risk
- Easier rollout
- Safer for inventory data

Consequence:
The model may analyze data and generate read-only SQL, but it must never issue write operations.

## D-006: Controlled read-only SQL pipeline

Decision:
Allow the model to generate flexible PostgreSQL SELECT queries, but execute them only through a low-privilege read-only chat layer.

Why:
- The intent catalog was too brittle for broader internal analytics questions
- Direct SQL is more expressive for aggregates, joins, and ad hoc filters
- The internal-user context lowers adversarial pressure, but not to zero

Consequence:
Chat must query only approved read-only views, run under a restricted database role, validate single-statement SELECT or WITH queries, retry failed queries with execution feedback, and keep a deterministic fallback path during rollout.

## D-007: Dev and prod from day 1

Decision:
Keep separate dev and prod environments.

Why:
- Safer testing
- Easier rollout discipline
- Prevents accidental prod changes

Consequence:
We need separate secrets, database projects, and deployment targets.

## D-008: No images in v1

Decision:
Do not build image upload or image-heavy catalog features in v1.

Why:
- Keeps scope small
- Avoids storage complexity
- Not required for the core workflow

Consequence:
Product records are text-first in early phases.

## Do not break these

- Do not allow chat to mutate data.
- Do not bypass auth or role checks.
- Do not expose unrestricted database access from the client.
- Do not add billing, barcode scanning, or multi-shop support in v1.
- Do not add infra that raises setup cost without a phase-approved need.