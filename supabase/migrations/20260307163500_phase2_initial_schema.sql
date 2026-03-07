create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('admin', 'staff', 'viewer');
  end if;

  if not exists (select 1 from pg_type where typname = 'sale_mode') then
    create type public.sale_mode as enum ('linked', 'manual');
  end if;

  if not exists (select 1 from pg_type where typname = 'inventory_transaction_type') then
    create type public.inventory_transaction_type as enum (
      'stock_in',
      'stock_out',
      'adjustment',
      'archive',
      'restore'
    );
  end if;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  email text not null check (position('@' in email) > 1),
  password_hash text not null,
  role public.user_role not null default 'staff',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.category_master (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 80),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  is_active boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory_products (
  id uuid primary key default gen_random_uuid(),
  sku text not null check (char_length(trim(sku)) between 1 and 64),
  name text not null check (char_length(trim(name)) between 1 and 160),
  brand text,
  category_id uuid not null references public.category_master(id) on delete restrict,
  category_name text not null check (char_length(trim(category_name)) between 1 and 80),
  size text,
  color text,
  purchase_price numeric(12, 2) not null default 0 check (purchase_price >= 0),
  selling_price numeric(12, 2) not null default 0 check (selling_price >= 0),
  current_stock integer not null default 0 check (current_stock >= 0),
  reorder_level integer not null default 0 check (reorder_level >= 0),
  location text,
  notes text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales_entries (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.inventory_products(id) on delete set null,
  product_name_snapshot text not null check (char_length(trim(product_name_snapshot)) between 1 and 160),
  category_name_snapshot text not null check (char_length(trim(category_name_snapshot)) between 1 and 80),
  brand_snapshot text,
  size_snapshot text,
  color_snapshot text,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  line_total numeric(12, 2) generated always as ((quantity::numeric * unit_price)) stored,
  sale_mode public.sale_mode not null,
  sold_at timestamptz not null default now(),
  created_by uuid not null references public.users(id) on delete restrict,
  notes text,
  constraint sales_entries_product_link_check check (
    (sale_mode = 'manual' and product_id is null)
    or (sale_mode = 'linked' and product_id is not null)
  )
);

create table if not exists public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.inventory_products(id) on delete restrict,
  transaction_type public.inventory_transaction_type not null,
  quantity_delta integer not null,
  reason text not null check (char_length(trim(reason)) between 1 and 240),
  performed_by uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete restrict,
  original_question text not null check (char_length(trim(original_question)) > 0),
  parsed_intent_json jsonb not null default '{}'::jsonb,
  response_text text not null default '',
  status text not null check (char_length(trim(status)) between 1 and 40),
  created_at timestamptz not null default now()
);

create table if not exists public.backups_log (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references public.users(id) on delete restrict,
  export_type text not null check (char_length(trim(export_type)) between 1 and 80),
  file_label text not null check (char_length(trim(file_label)) between 1 and 160),
  status text not null check (char_length(trim(status)) between 1 and 40),
  created_at timestamptz not null default now()
);

create unique index if not exists users_email_lower_idx
  on public.users (lower(email));

create index if not exists users_created_at_idx
  on public.users (created_at desc);

create unique index if not exists category_master_name_lower_idx
  on public.category_master (lower(name));

create unique index if not exists category_master_slug_lower_idx
  on public.category_master (lower(slug));

create index if not exists category_master_sort_order_idx
  on public.category_master (sort_order asc, name asc);

create unique index if not exists inventory_products_sku_lower_idx
  on public.inventory_products (lower(sku));

create index if not exists inventory_products_category_id_idx
  on public.inventory_products (category_id);

create index if not exists inventory_products_created_at_idx
  on public.inventory_products (created_at desc);

create index if not exists inventory_products_archived_idx
  on public.inventory_products (is_archived, created_at desc);

create index if not exists sales_entries_sold_at_idx
  on public.sales_entries (sold_at desc);

create index if not exists sales_entries_product_id_idx
  on public.sales_entries (product_id);

create index if not exists sales_entries_created_by_idx
  on public.sales_entries (created_by, sold_at desc);

create index if not exists inventory_transactions_product_id_idx
  on public.inventory_transactions (product_id, created_at desc);

create index if not exists inventory_transactions_performed_by_idx
  on public.inventory_transactions (performed_by, created_at desc);

create index if not exists chat_logs_user_id_idx
  on public.chat_logs (user_id, created_at desc);

create index if not exists chat_logs_created_at_idx
  on public.chat_logs (created_at desc);

create index if not exists backups_log_requested_by_idx
  on public.backups_log (requested_by, created_at desc);

create index if not exists backups_log_created_at_idx
  on public.backups_log (created_at desc);

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

drop trigger if exists category_master_set_updated_at on public.category_master;
create trigger category_master_set_updated_at
before update on public.category_master
for each row
execute function public.set_updated_at();

drop trigger if exists inventory_products_set_updated_at on public.inventory_products;
create trigger inventory_products_set_updated_at
before update on public.inventory_products
for each row
execute function public.set_updated_at();
