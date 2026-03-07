# LLM Design

## Goal

Answer common inventory and sales questions in plain language without allowing the model to run arbitrary SQL or write data.

## Supported languages

- English
- Hindi
- Hinglish

## Core rule

The model must output strict JSON intent objects for interpretation. It must not output SQL.

## v1 supported intents

- inventory_count
- inventory_search
- low_stock_list
- product_lookup
- sales_total
- sales_by_category
- sales_by_brand
- recent_activity_summary
- dashboard_summary
- unsupported_request

## Supported time ranges

- today
- yesterday
- this_week
- last_7_days
- last_week
- this_month
- last_month
- all_time

## Structured intent notes

- `filters.dateFrom` and `filters.dateTo` should be set when the user gives an explicit date range.
- `requestedMetrics` keeps extra asks such as totals, top product, top brand, or top category inside the same query.
- Explicit dates should win over vague labels like `last_week` when both appear in the question.

## Processing pipeline

1. Normalize the user question.
2. Ask the model for strict JSON only.
3. Validate the JSON against the supported intent shape.
4. Map the intent to approved query helpers.
5. Execute the query.
6. Fall back to deterministic parsing if OpenAI intent extraction fails.
7. Generate the final answer deterministically from approved query results.

## Guardrails

- Strip markdown fences before JSON parsing.
- Reject unknown intents.
- Reject missing required filters for product lookup.
- Use timeouts and fallback responses.
- Log successful, unsupported, and failed chat requests when the database-backed user exists.
- Treat each v1 chat request as stateless.
- Never allow chat to create, update, archive, restore, export, or delete records.

## Context and normalization

- Support common synonyms like shoes and shoe, tshirt and t-shirt, lower and track pant.
- Support date phrases like today, yesterday, this week, last week, and last month.
- Keep brand and category matching tolerant but explicit.
- Prefer active inventory unless the user explicitly asks about archived products.

## UI output notes

- The chat response may include a small tabular summary for the UI.
- The UI may expose the parsed intent to make human verification easier in development.

## Follow-up behavior

v1 should not depend on prior chat turns. If a follow-up question lacks enough detail, the app should ask the user to restate it clearly.
