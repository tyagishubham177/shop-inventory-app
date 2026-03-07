# Phase 6

## Goal

Implement safe read-only LLM chat with direct SQL planning.

## Deliverables

- Approved chat read-only views
- Read-only SQL execution route through Supabase RPC
- SQL planning and repair helpers
- Response generation helpers
- Chat UI with SQL debug visibility
- Seeded demo data and manual chat test checklist

## Human verification

- Apply the direct chat SQL migration in Supabase.
- Open `/chat` and confirm the page loads for any signed-in role.
- Ask `What are total sales today?` and confirm the answer uses the seeded sales data.
- Ask `Which brand sold the most in the last 7 days?` and confirm the answer is `SwiftStep` with the seeded data.
- Ask `Find Air Runner Pro.` and confirm the product lookup shows stock 18 and selling price 1900 INR.
- Ask `Show the low-stock products right now.` and confirm the answer includes City Walk Classic, Trail Grip X, Winter Puff Vest, Linen Weekend Shirt, and other low-stock items.
- Open the SQL panel and confirm the final query uses only approved `chat_*` views.
- Ask an unsupported write request like `Reduce Air Runner Pro stock by 2` and confirm the response stays read-only.