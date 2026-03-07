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

### backups_log

- id
- requested_by
- export_type
- file_label
- status
- created_at

## Access model

- Admin can manage users, categories, inventory, and backup export.
- Staff can manage inventory and sales within allowed routes.
- Viewer, if enabled, is read-only.

## Migration notes

- Add indexes for email, sku, category, sold_at, and created_at filters.
- Keep migrations additive where possible.
- Update this file when schema changes.
