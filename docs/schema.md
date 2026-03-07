# Schema

## Core tables

### users

- id
- name
- email
- password_hash
- role
- is_active
- created_at
- updated_at

### category_master

- id
- name
- slug
- is_active
- sort_order
- created_at
- updated_at

### inventory_products

- id
- sku
- name
- brand
- category_id
- category_name
- size
- color
- purchase_price
- selling_price
- current_stock
- reorder_level
- location
- notes
- is_archived
- created_at
- updated_at

Note:
`category_name` is a snapshot copy for easier reporting. The source of truth is still `category_id`.

### sales_entries

- id
- product_id nullable
- product_name_snapshot
- category_name_snapshot
- brand_snapshot
- size_snapshot
- color_snapshot
- quantity
- unit_price
- line_total
- sale_mode (`linked` or `manual`)
- sold_at
- created_by
- notes

### inventory_transactions

- id
- product_id
- transaction_type (`stock_in`, `stock_out`, `adjustment`, `archive`, `restore`)
- quantity_delta
- reason
- performed_by
- created_at

### chat_logs

- id
- user_id
- original_question
- parsed_intent_json
- response_text
- status
- created_at

Note:
`parsed_intent_json` now stores chat execution metadata for both legacy intent parsing and direct SQL planning.

### backups_log

- id
- requested_by
- export_type
- file_label
- status
- created_at

## Chat read-only views

### chat_inventory_products

Read-only inventory view used by LLM-generated SQL.

### chat_sales_entries

Read-only sales view with stable column names for analytics queries.

### chat_inventory_transactions

Read-only inventory history view with product and actor snapshots.

### chat_recent_activity

Unified recent activity feed combining sales and inventory events.

## Chat execution function

### execute_chat_read_query(query_text text, max_rows integer)

- Security definer function owned by a low-privilege `chat_query_role`
- Accepts one SQL statement that must start with `SELECT` or `WITH`
- Rejects comments, write/admin keywords, and system-catalog access
- Returns JSON with rows, rowCount, and truncated metadata
- Service-role app code calls this function through Supabase RPC

## Access model

- Admin can manage users, categories, inventory, and backup export.
- Staff can manage inventory and sales within allowed routes.
- Viewer, if enabled, is read-only.
- Chat SQL runs through `chat_query_role`, which can only read approved `chat_*` views.

## Migration notes

- Add indexes for email, sku, category, sold_at, and created_at filters.
- Keep migrations additive where possible.
- Update this file when schema changes.