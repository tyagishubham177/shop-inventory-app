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

## Processing pipeline

1. Normalize the user question.
2. Ask the model for strict JSON only.
3. Validate the JSON against a schema.
4. Map the intent to approved query helpers.
5. Execute the query.
6. Ask the model to phrase a concise answer using only returned data.

## Guardrails

- Strip markdown fences before JSON parsing.
- Reject unknown intents.
- Reject missing required filters.
- Use timeouts and fallback responses.
- Log parsing failures and unsupported requests.
- Treat each v1 chat request as stateless.

## Context and normalization

- Support common synonyms like shoes and shoe, tshirt and t-shirt, lower and track pant.
- Support date phrases like today, yesterday, this week, and last month.
- Keep brand and category matching tolerant but explicit.

## Follow-up behavior

v1 should not depend on prior chat turns. If a follow-up question lacks enough detail, the app should ask the user to restate it clearly.
