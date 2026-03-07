# Phase 2

## Goal

Implement the core database schema for auth, inventory, sales, chat logs, and backups.

## Deliverables

- Users migration
- Category master migration
- Inventory products migration
- Sales entries migration
- Inventory transactions migration
- Chat logs migration
- Backups log migration
- Core indexes and update triggers
- Dev seed helpers for starter users and categories

## Human verification

- Apply the Phase 2 SQL migration to the dev Supabase database.
- Confirm the tables appear in Supabase: `users`, `category_master`, `inventory_products`, `sales_entries`, `inventory_transactions`, `chat_logs`, and `backups_log`.
- Confirm unique indexes exist for `users.email`, `category_master.slug`, and `inventory_products.sku`.
- Confirm date and filter indexes exist for category, `sold_at`, and `created_at` queries.
- Run `supabase/seed/20260307172000_dev_users.sql` and confirm the starter users appear in `public.users`.
- Run `supabase/seed/20260307174000_dev_categories.sql` and confirm the starter categories appear in `public.category_master`.
- Confirm the login flow still works locally with `AUTH_ALLOW_DEV_DEMO_USERS=false` so the database path is verified.