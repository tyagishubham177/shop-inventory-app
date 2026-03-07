do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'chat_query_role') then
    create role chat_query_role nologin noinherit;
  end if;
end
$$;

create or replace view public.chat_inventory_products as
select
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
  (current_stock <= reorder_level) as is_low_stock,
  is_archived,
  location,
  notes,
  created_at,
  updated_at
from public.inventory_products;

create or replace view public.chat_sales_entries as
select
  id,
  product_id,
  product_name_snapshot as product_name,
  category_name_snapshot as category_name,
  brand_snapshot as brand,
  size_snapshot as size,
  color_snapshot as color,
  quantity,
  unit_price,
  line_total,
  sale_mode::text as sale_mode,
  sold_at,
  sold_at::date as sold_on,
  created_by,
  notes
from public.sales_entries;

create or replace view public.chat_inventory_transactions as
select
  it.id,
  it.product_id,
  ip.sku as product_sku,
  ip.name as product_name,
  ip.category_name,
  it.transaction_type::text as transaction_type,
  it.quantity_delta,
  it.reason,
  it.performed_by,
  u.name as performed_by_name,
  it.created_at
from public.inventory_transactions it
join public.inventory_products ip on ip.id = it.product_id
join public.users u on u.id = it.performed_by;

create or replace view public.chat_recent_activity as
select
  se.sold_at as happened_at,
  'sale'::text as activity_type,
  se.product_name_snapshot as title,
  concat('Sold ', se.quantity, ' unit(s) for INR ', se.line_total, ' via ', se.sale_mode::text, ' sale.') as details
from public.sales_entries se
union all
select
  it.created_at as happened_at,
  it.transaction_type::text as activity_type,
  ip.name as title,
  concat(ip.sku, ': ', it.reason, ' (', it.quantity_delta, ')') as details
from public.inventory_transactions it
join public.inventory_products ip on ip.id = it.product_id;

create or replace function public.execute_chat_read_query(query_text text, max_rows integer default 40)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  sanitized_query text;
  effective_limit integer := greatest(1, least(coalesce(max_rows, 40), 100));
  limited_row_count integer := 0;
  result_rows json := '[]'::json;
begin
  sanitized_query := trim(coalesce(query_text, ''));

  if sanitized_query = '' then
    raise exception 'Chat SQL cannot be empty.';
  end if;

  sanitized_query := regexp_replace(sanitized_query, ';\s*$', '');

  if position(';' in sanitized_query) > 0 then
    raise exception 'Only a single SQL statement is allowed.';
  end if;

  if sanitized_query !~* '^\s*(select|with)\b' then
    raise exception 'Chat SQL must start with SELECT or WITH.';
  end if;

  if sanitized_query ~ '(--|/\*|\*/)' then
    raise exception 'SQL comments are not allowed.';
  end if;

  if sanitized_query ~* '\b(insert|update|delete|merge|upsert|alter|drop|truncate|grant|revoke|create|replace|comment|copy|call|do|execute|prepare|deallocate|discard|vacuum|analyze|refresh|notify|listen|unlisten)\b' then
    raise exception 'Chat SQL must stay read-only.';
  end if;

  if sanitized_query ~* '\b(pg_sleep|information_schema|pg_catalog|pg_toast)\b' then
    raise exception 'System catalogs and blocking functions are not allowed.';
  end if;

  if sanitized_query !~* '\b(chat_inventory_products|chat_sales_entries|chat_inventory_transactions|chat_recent_activity)\b' then
    raise exception 'Chat SQL must reference at least one approved chat_* view.';
  end if;

  if sanitized_query ~* '(^|[^a-z_])(inventory_products|sales_entries|inventory_transactions|users|category_master|chat_logs|backups_log)([^a-z_]|$)' then
    raise exception 'Chat SQL cannot reference base tables directly.';
  end if;

  perform set_config('statement_timeout', '4000', true);
  perform set_config('lock_timeout', '1000', true);

  execute format(
    'select count(*) from (select 1 from (%s) as chat_query limit %s) as limited_rows',
    sanitized_query,
    effective_limit + 1
  ) into limited_row_count;

  execute format(
    'select coalesce(json_agg(row_to_json(result_row)), ''[]''::json) from (select * from (%s) as chat_query limit %s) as result_row',
    sanitized_query,
    effective_limit
  ) into result_rows;

  return jsonb_build_object(
    'rows', coalesce(result_rows::jsonb, '[]'::jsonb),
    'rowCount', least(limited_row_count, effective_limit),
    'truncated', limited_row_count > effective_limit
  );
end;
$$;

revoke all on function public.execute_chat_read_query(text, integer) from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on function public.execute_chat_read_query(text, integer) from anon';
  end if;

  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on function public.execute_chat_read_query(text, integer) from authenticated';
  end if;

  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.execute_chat_read_query(text, integer) to service_role';
  end if;
end
$$;