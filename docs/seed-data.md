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

## Suggested demo inventory

- 20 to 30 products across categories
- Mixed stock levels for low-stock testing
- At least 5 archived products for archive and restore testing

## Suggested demo sales

- Recent sales across multiple dates
- Mix of linked and manual sales entries
- Enough data to test dashboard summaries and chat questions