# Design

## Architecture summary

- Next.js app for UI and route handlers
- Supabase Postgres for the database
- Custom password and session handling in the app layer
- OpenAI Responses API for intent parsing and answer phrasing
- Mobile-first UI with simple admin and staff flows

## Primary flows

### Auth flow

1. User submits email and password.
2. Server verifies password hash.
3. Server issues a signed session.
4. Middleware protects app routes.
5. Role checks gate sensitive actions.

### Inventory flow

1. User views or searches inventory.
2. User creates, edits, archives, restores, or adjusts stock.
3. Server validates payloads and writes audit-friendly records.

### Sales flow

1. User creates a sale as linked or manual entry.
2. Inventory updates only where the sale is linked to tracked items.
3. Manual sales remain allowed without strict inventory reconciliation.

### Chat flow

1. User asks a question in English, Hindi, or Hinglish.
2. Model converts the question into a strict intent object.
3. Backend maps that intent to approved query helpers.
4. Backend sends query results back to the model for a concise answer.

## Environments

- Dev: local app plus dev Supabase and dev OpenAI key
- Prod: deployed app plus prod Supabase and prod OpenAI key

Never share secrets across environments.

## Middleware spec

- Redirect anonymous users away from protected routes.
- Redirect authenticated users away from the login page.
- Attach current user context where needed.
- Enforce role restrictions on admin-only actions.

## Design constraints

- Keep interactions fast on phones.
- Prefer text-first workflows.
- Keep forms short and forgiving.
- Avoid over-abstracted code in early phases.
