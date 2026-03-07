# Seed Data

## Suggested seed categories

- Shoes
- Jeans
- Jackets
- T-Shirts
- Lowers
- Shirts
- Accessories

## Suggested demo users

- Admin: `admin@local.shop` / `AdminPass123!`
- Staff: `staff@local.shop` / `StaffPass123!`
- Viewer: `viewer@local.shop` / `ViewerPass123!`

## Dev user seed helper

- Run `supabase/seed/20260307172000_dev_users.sql` in the dev Supabase project only.
- This inserts the starter admin, staff, and viewer users into `public.users`.
- Do not run this seed file in production.

## Dev category seed helper

- Run `supabase/seed/20260307174000_dev_categories.sql` in the dev Supabase project.
- This inserts the starter category master rows into `public.category_master`.
- It is safe to rerun because each insert checks for an existing slug first.

## Phase 6 inventory and sales seed helper

- Run `supabase/seed/20260307201000_dev_phase6_inventory_sales_chat.sql` after the users and categories seeds.
- This inserts or updates 25 inventory products, 12 inventory transactions, and 18 sales entries for chat verification.
- The file is dev-only and safe to rerun because every record uses a fixed UUID with `ON CONFLICT` updates.

## Seed highlights for chat checks

- 20 active products and 5 archived products
- 190 total units across active inventory
- 8 low-stock active products
- 18 mixed linked and manual sales entries
- 30 units sold all time for 32680 INR total revenue
- 6646 INR revenue today from 4 sales lines and 7 units
- 17988 INR revenue in the last 7 days from 10 sales lines
- `SwiftStep` is the top-selling brand in the last 7 days
- `Northwind` is the top-selling brand all time in this seed set
- `Air Runner Pro` remains a reliable product-lookup test with stock 18 and selling price 1900 INR

## Suggested demo inventory shape

- Multiple categories and brands so the chat can answer category and brand breakdowns
- Mixed stock levels for low-stock testing
- Archived records for include-archived verification
- Product names that exercise synonym matching like shoes, T-Shirts, and lowers

## Suggested demo sales shape

- Recent sales across multiple relative dates
- Mix of linked and manual sales entries
- Enough data to test dashboard summaries, activity, and chat questions

