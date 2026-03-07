# LLM Design

## Goal

Answer inventory, sales, dashboard, and recent-activity questions in plain language with a direct read-only SQL workflow that stays non-mutating.

## Supported languages

- English
- Hindi
- Hinglish

## Core rule

The model may generate read-only PostgreSQL queries, but only against approved `chat_*` views and only through the controlled chat execution function.

## Processing pipeline

1. Normalize the user question.
2. Ask the model for one read-only SQL query plus a short planning summary.
3. Validate that the SQL is a single `SELECT` or `WITH` statement with no write/admin patterns.
4. Execute it through `execute_chat_read_query`, which runs as the low-privilege `chat_query_role`.
5. If the query fails or returns no rows, send the execution feedback back to the model for a repair attempt.
6. Summarize the final result set for the user.
7. Log the question, SQL attempts, and response.
8. Fall back to the legacy intent pipeline if direct SQL planning is unavailable during rollout.

## Approved read-only objects

- `chat_inventory_products`
- `chat_sales_entries`
- `chat_inventory_transactions`
- `chat_recent_activity`

## Guardrails

- Strip markdown fences before SQL or JSON parsing.
- Reject multiple statements.
- Reject comments and obvious write/admin keywords.
- Reject access to system catalogs.
- Execute through a low-privilege function owner rather than the full service role.
- Keep statement timeouts short.
- Treat each v1 chat request as stateless.
- Never allow chat to create, update, archive, restore, export, or delete records.

## Repair loop notes

- Retry when SQL validation fails, execution errors, or the result set comes back empty.
- Include the last SQL text and failure message in the repair prompt.
- Keep retries bounded so the route stays responsive.

## UI output notes

- The chat response may include a small tabular summary for the UI.
- The UI may expose the final SQL and retry history to make human verification easier in development.

## Follow-up behavior

v1 should not depend on prior chat turns. If a follow-up question lacks enough detail, the app should ask the user to restate it clearly.