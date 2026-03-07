-- Dev-only inventory, sales, and activity seed for Phase 6 chat verification.
-- Run this after the dev users and dev categories seed files.
-- Safe to rerun in the dev project because every row uses a fixed UUID.

insert into public.inventory_products (
  id,
  sku,
  name,
  brand,
  category_id,
  category_name,
  size,
  color,
  purchase_price,
  selling_price,
  current_stock,
  reorder_level,
  location,
  notes,
  is_archived
)
values
  ('10000000-0000-4000-8000-000000000001', 'SHOE-001', 'Air Runner Pro', 'SwiftStep', (select id from public.category_master where lower(slug) = 'shoes'), 'Shoes', '9', 'Teal', 1200.00, 1900.00, 18, 6, 'Rack A1', 'Top-selling performance shoe.', false),
  ('10000000-0000-4000-8000-000000000002', 'SHOE-002', 'City Walk Classic', 'MetroFeet', (select id from public.category_master where lower(slug) = 'shoes'), 'Shoes', '8', 'Tan', 900.00, 1400.00, 5, 8, 'Rack A2', 'Low-stock everyday shoe.', false),
  ('10000000-0000-4000-8000-000000000003', 'SHOE-003', 'Trail Grip X', 'PeakStride', (select id from public.category_master where lower(slug) = 'shoes'), 'Shoes', '10', 'Grey', 1300.00, 2100.00, 3, 5, 'Rack A3', 'Trail model with a short buffer.', false),
  ('10000000-0000-4000-8000-000000000004', 'SHOE-004', 'Kids Flash Sneaker', 'TinyToes', (select id from public.category_master where lower(slug) = 'shoes'), 'Shoes', '4', 'Blue', 950.00, 1600.00, 12, 4, 'Rack A4', 'Kids shoe for family orders.', false),
  ('10000000-0000-4000-8000-000000000005', 'JEAN-001', 'Urban Blue Slim', 'DenimCo', (select id from public.category_master where lower(slug) = 'jeans'), 'Jeans', '32', 'Blue', 1100.00, 1799.00, 14, 6, 'Rack B1', 'Steady denim seller.', false),
  ('10000000-0000-4000-8000-000000000006', 'JEAN-002', 'Retro Black Straight', 'DenimCo', (select id from public.category_master where lower(slug) = 'jeans'), 'Jeans', '34', 'Black', 1150.00, 1899.00, 2, 5, 'Rack B2', 'Low-stock black denim.', false),
  ('10000000-0000-4000-8000-000000000007', 'JACK-001', 'Monsoon Shield Jacket', 'Northwind', (select id from public.category_master where lower(slug) = 'jackets'), 'Jackets', 'L', 'Olive', 1600.00, 2499.00, 6, 4, 'Rack C1', 'Rain-friendly jacket.', false),
  ('10000000-0000-4000-8000-000000000008', 'JACK-002', 'Winter Puff Vest', 'Northwind', (select id from public.category_master where lower(slug) = 'jackets'), 'Jackets', 'M', 'Black', 1800.00, 2799.00, 1, 3, 'Rack C2', 'Cold-season outer layer.', false),
  ('10000000-0000-4000-8000-000000000009', 'JACK-003', 'Rainproof Windbreaker', 'Northwind', (select id from public.category_master where lower(slug) = 'jackets'), 'Jackets', 'M', 'Navy', 1500.00, 2299.00, 8, 4, 'Rack C3', 'Mid-price jacket for rainy days.', false),
  ('10000000-0000-4000-8000-000000000010', 'TEE-001', 'Everyday Cotton Tee White', 'ThreadLeaf', (select id from public.category_master where lower(slug) = 't-shirts'), 'T-Shirts', 'M', 'White', 250.00, 599.00, 22, 8, 'Rack D1', 'Staple white tee.', false),
  ('10000000-0000-4000-8000-000000000011', 'TEE-002', 'Everyday Cotton Tee Black', 'ThreadLeaf', (select id from public.category_master where lower(slug) = 't-shirts'), 'T-Shirts', 'M', 'Black', 250.00, 599.00, 7, 8, 'Rack D2', 'Black tee close to reorder level.', false),
  ('10000000-0000-4000-8000-000000000012', 'TEE-003', 'Graphic Street Tee', 'BoldLine', (select id from public.category_master where lower(slug) = 't-shirts'), 'T-Shirts', 'L', 'White', 300.00, 699.00, 15, 5, 'Rack D3', 'Graphic tee for trend checks.', false),
  ('10000000-0000-4000-8000-000000000013', 'LOW-001', 'Track Flex Lower', 'MoveMode', (select id from public.category_master where lower(slug) = 'lowers'), 'Lowers', 'M', 'Charcoal', 700.00, 1100.00, 9, 6, 'Rack E1', 'Track-pant style lower.', false),
  ('10000000-0000-4000-8000-000000000014', 'LOW-002', 'Gym Active Jogger', 'MoveMode', (select id from public.category_master where lower(slug) = 'lowers'), 'Lowers', 'L', 'Black', 760.00, 1200.00, 4, 6, 'Rack E2', 'Jogger with low stock for chat tests.', false),
  ('10000000-0000-4000-8000-000000000015', 'LOW-003', 'Lounge Knit Lower', 'SoftRoute', (select id from public.category_master where lower(slug) = 'lowers'), 'Lowers', 'L', 'Stone', 500.00, 950.00, 16, 5, 'Rack E3', 'Comfort lower with healthy stock.', false),
  ('10000000-0000-4000-8000-000000000016', 'SHIRT-001', 'Office Stripe Shirt', 'TailorMark', (select id from public.category_master where lower(slug) = 'shirts'), 'Shirts', '40', 'Blue', 850.00, 1499.00, 11, 4, 'Rack F1', 'Formal shirt for office buyers.', false),
  ('10000000-0000-4000-8000-000000000017', 'SHIRT-002', 'Linen Weekend Shirt', 'TailorMark', (select id from public.category_master where lower(slug) = 'shirts'), 'Shirts', '42', 'Beige', 950.00, 1699.00, 0, 3, 'Rack F2', 'Out of stock and needs refill.', false),
  ('10000000-0000-4000-8000-000000000018', 'ACC-001', 'Leather Belt Brown', 'ClassicLoop', (select id from public.category_master where lower(slug) = 'accessories'), 'Accessories', null, 'Brown', 350.00, 799.00, 20, 6, 'Rack G1', 'Accessory add-on item.', false),
  ('10000000-0000-4000-8000-000000000019', 'ACC-002', 'Canvas Cap Teal', 'StreetArc', (select id from public.category_master where lower(slug) = 'accessories'), 'Accessories', null, 'Teal', 180.00, 499.00, 13, 5, 'Rack G2', 'Cap used in recent sales tests.', false),
  ('10000000-0000-4000-8000-000000000020', 'ACC-003', 'Wool Scarf Grey', 'Northwind', (select id from public.category_master where lower(slug) = 'accessories'), 'Accessories', null, 'Grey', 420.00, 899.00, 4, 4, 'Rack G3', 'Accessory at the reorder line.', false),
  ('10000000-0000-4000-8000-000000000021', 'ARCH-001', 'Archive Denim Sample', 'DenimCo', (select id from public.category_master where lower(slug) = 'jeans'), 'Jeans', '32', 'Blue', 0.00, 999.00, 0, 0, 'Archive', 'Archived sample product.', true),
  ('10000000-0000-4000-8000-000000000022', 'ARCH-002', 'Old Promo Tee', 'ThreadLeaf', (select id from public.category_master where lower(slug) = 't-shirts'), 'T-Shirts', 'M', 'Red', 0.00, 399.00, 0, 0, 'Archive', 'Archived promotional tee.', true),
  ('10000000-0000-4000-8000-000000000023', 'ARCH-003', 'Legacy Runner 2023', 'SwiftStep', (select id from public.category_master where lower(slug) = 'shoes'), 'Shoes', '9', 'White', 0.00, 1299.00, 1, 0, 'Archive', 'Archived shoe line kept for lookup tests.', true),
  ('10000000-0000-4000-8000-000000000024', 'ARCH-004', 'Discontinued Wallet', 'ClassicLoop', (select id from public.category_master where lower(slug) = 'accessories'), 'Accessories', null, 'Black', 0.00, 699.00, 0, 0, 'Archive', 'Archived wallet.', true),
  ('10000000-0000-4000-8000-000000000025', 'ARCH-005', 'Pilot Shirt Sample', 'TailorMark', (select id from public.category_master where lower(slug) = 'shirts'), 'Shirts', '40', 'White', 0.00, 899.00, 2, 0, 'Archive', 'Archived shirt kept for include-archived checks.', true)
on conflict (id) do update
set
  sku = excluded.sku,
  name = excluded.name,
  brand = excluded.brand,
  category_id = excluded.category_id,
  category_name = excluded.category_name,
  size = excluded.size,
  color = excluded.color,
  purchase_price = excluded.purchase_price,
  selling_price = excluded.selling_price,
  current_stock = excluded.current_stock,
  reorder_level = excluded.reorder_level,
  location = excluded.location,
  notes = excluded.notes,
  is_archived = excluded.is_archived;

insert into public.inventory_transactions (
  id,
  product_id,
  transaction_type,
  quantity_delta,
  reason,
  performed_by,
  created_at
)
values
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', 'stock_in', 6, 'Restocked Trail Grip X for weekend demand.', '11111111-1111-4111-8111-111111111111', now() - interval '10 days'),
  ('30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000003', 'stock_out', -3, 'Trail Grip X moved out after linked sales.', '22222222-2222-4222-8222-222222222222', now() - interval '2 days'),
  ('30000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', 'adjustment', -2, 'City Walk Classic count corrected after shelf check.', '22222222-2222-4222-8222-222222222222', now() - interval '1 day'),
  ('30000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000008', 'stock_in', 1, 'Winter Puff Vest emergency refill.', '11111111-1111-4111-8111-111111111111', now() - interval '6 days'),
  ('30000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000017', 'adjustment', -3, 'Linen Weekend Shirt counted as sold out after physical check.', '11111111-1111-4111-8111-111111111111', now() - interval '3 hours'),
  ('30000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000014', 'stock_out', -2, 'Gym Active Jogger linked sale deduction.', '22222222-2222-4222-8222-222222222222', now() - interval '3 days'),
  ('30000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000021', 'archive', 0, 'Archive Denim Sample moved to archived catalog.', '11111111-1111-4111-8111-111111111111', now() - interval '30 days'),
  ('30000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000022', 'archive', 0, 'Old Promo Tee archived after campaign ended.', '11111111-1111-4111-8111-111111111111', now() - interval '25 days'),
  ('30000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000023', 'archive', 0, 'Legacy Runner 2023 archived after replacement launch.', '11111111-1111-4111-8111-111111111111', now() - interval '20 days'),
  ('30000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000024', 'archive', 0, 'Discontinued Wallet archived from accessories list.', '11111111-1111-4111-8111-111111111111', now() - interval '18 days'),
  ('30000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000025', 'archive', 0, 'Pilot Shirt Sample archived after sampling finished.', '11111111-1111-4111-8111-111111111111', now() - interval '15 days'),
  ('30000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-000000000010', 'stock_in', 12, 'Everyday Cotton Tee White refill for fast-moving basics.', '22222222-2222-4222-8222-222222222222', now() - interval '5 days')
on conflict (id) do update
set
  product_id = excluded.product_id,
  transaction_type = excluded.transaction_type,
  quantity_delta = excluded.quantity_delta,
  reason = excluded.reason,
  performed_by = excluded.performed_by,
  created_at = excluded.created_at;

insert into public.sales_entries (
  id,
  product_id,
  product_name_snapshot,
  category_name_snapshot,
  brand_snapshot,
  size_snapshot,
  color_snapshot,
  quantity,
  unit_price,
  sale_mode,
  sold_at,
  created_by,
  notes
)
values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Air Runner Pro', 'Shoes', 'SwiftStep', '9', 'Teal', 2, 1900.00, 'linked', now() - interval '2 hours', '22222222-2222-4222-8222-222222222222', 'Two units sold from the counter.'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000010', 'Everyday Cotton Tee White', 'T-Shirts', 'ThreadLeaf', 'M', 'White', 3, 599.00, 'linked', now() - interval '4 hours', '22222222-2222-4222-8222-222222222222', 'Three white tees sold today.'),
  ('20000000-0000-4000-8000-000000000003', null, 'Custom Alteration Fee', 'Accessories', null, null, null, 1, 250.00, 'manual', now() - interval '5 hours', '11111111-1111-4111-8111-111111111111', 'Manual service-style sale for a walk-in customer.'),
  ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000018', 'Leather Belt Brown', 'Accessories', 'ClassicLoop', null, 'Brown', 1, 799.00, 'linked', now() - interval '1 hour', '22222222-2222-4222-8222-222222222222', 'Accessory add-on to a larger order.'),
  ('20000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000013', 'Track Flex Lower', 'Lowers', 'MoveMode', 'M', 'Charcoal', 2, 1100.00, 'linked', now() - interval '1 day', '11111111-1111-4111-8111-111111111111', 'Two lowers sold yesterday.'),
  ('20000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000002', 'City Walk Classic', 'Shoes', 'MetroFeet', '8', 'Tan', 1, 1400.00, 'linked', now() - interval '1 day 2 hours', '22222222-2222-4222-8222-222222222222', 'Single pair sold yesterday.'),
  ('20000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000016', 'Office Stripe Shirt', 'Shirts', 'TailorMark', '40', 'Blue', 2, 1499.00, 'linked', now() - interval '3 days', '11111111-1111-4111-8111-111111111111', 'Office shirts sold in a bulk order.'),
  ('20000000-0000-4000-8000-000000000008', null, 'Walk-in Shirt Sale', 'Shirts', 'Local Counter', null, null, 1, 950.00, 'manual', now() - interval '3 days 3 hours', '22222222-2222-4222-8222-222222222222', 'Manual shirt sale without a linked inventory SKU.'),
  ('20000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000012', 'Graphic Street Tee', 'T-Shirts', 'BoldLine', 'L', 'White', 4, 699.00, 'linked', now() - interval '6 days', '22222222-2222-4222-8222-222222222222', 'Four graphic tees sold during a weekend push.'),
  ('20000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000019', 'Canvas Cap Teal', 'Accessories', 'StreetArc', null, 'Teal', 2, 499.00, 'linked', now() - interval '6 days 2 hours', '11111111-1111-4111-8111-111111111111', 'Two caps sold together.'),
  ('20000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000005', 'Urban Blue Slim', 'Jeans', 'DenimCo', '32', 'Blue', 1, 1799.00, 'linked', now() - interval '8 days', '22222222-2222-4222-8222-222222222222', 'Denim sale just outside the 7-day window.'),
  ('20000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-000000000007', 'Monsoon Shield Jacket', 'Jackets', 'Northwind', 'L', 'Olive', 1, 2499.00, 'linked', now() - interval '8 days 4 hours', '22222222-2222-4222-8222-222222222222', 'Jacket sale from the prior week window.'),
  ('20000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000020', 'Wool Scarf Grey', 'Accessories', 'Northwind', null, 'Grey', 2, 899.00, 'linked', now() - interval '12 days', '11111111-1111-4111-8111-111111111111', 'Two scarves sold in one order.'),
  ('20000000-0000-4000-8000-000000000014', '10000000-0000-4000-8000-000000000006', 'Retro Black Straight', 'Jeans', 'DenimCo', '34', 'Black', 1, 1899.00, 'linked', now() - interval '20 days', '11111111-1111-4111-8111-111111111111', 'Single pair sold in the mid-month period.'),
  ('20000000-0000-4000-8000-000000000015', null, 'Festival Bundle', 'Accessories', 'Local Craft', null, null, 2, 650.00, 'manual', now() - interval '28 days', '22222222-2222-4222-8222-222222222222', 'Manual bundle sale for festival stock.'),
  ('20000000-0000-4000-8000-000000000016', '10000000-0000-4000-8000-000000000001', 'Air Runner Pro', 'Shoes', 'SwiftStep', '9', 'Teal', 1, 1900.00, 'linked', now() - interval '35 days', '22222222-2222-4222-8222-222222222222', 'Older shoe sale for last-month style queries.'),
  ('20000000-0000-4000-8000-000000000017', '10000000-0000-4000-8000-000000000011', 'Everyday Cotton Tee Black', 'T-Shirts', 'ThreadLeaf', 'M', 'Black', 2, 599.00, 'linked', now() - interval '32 days', '11111111-1111-4111-8111-111111111111', 'Older black tee sale for trend comparisons.'),
  ('20000000-0000-4000-8000-000000000018', '10000000-0000-4000-8000-000000000009', 'Rainproof Windbreaker', 'Jackets', 'Northwind', 'M', 'Navy', 1, 2299.00, 'linked', now() - interval '18 days', '22222222-2222-4222-8222-222222222222', 'Jacket sale in the mid-month range.')
on conflict (id) do update
set
  product_id = excluded.product_id,
  product_name_snapshot = excluded.product_name_snapshot,
  category_name_snapshot = excluded.category_name_snapshot,
  brand_snapshot = excluded.brand_snapshot,
  size_snapshot = excluded.size_snapshot,
  color_snapshot = excluded.color_snapshot,
  quantity = excluded.quantity,
  unit_price = excluded.unit_price,
  sale_mode = excluded.sale_mode,
  sold_at = excluded.sold_at,
  created_by = excluded.created_by,
  notes = excluded.notes;

