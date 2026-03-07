-- Dev-only starter categories for the category master table.
-- Safe to rerun in the dev project. Do not run this seed in production unless you want these exact starter categories.

insert into public.category_master (name, slug, is_active, sort_order)
select 'Shoes', 'shoes', true, 10
where not exists (
  select 1 from public.category_master where lower(slug) = lower('shoes')
);

insert into public.category_master (name, slug, is_active, sort_order)
select 'Jeans', 'jeans', true, 20
where not exists (
  select 1 from public.category_master where lower(slug) = lower('jeans')
);

insert into public.category_master (name, slug, is_active, sort_order)
select 'Jackets', 'jackets', true, 30
where not exists (
  select 1 from public.category_master where lower(slug) = lower('jackets')
);

insert into public.category_master (name, slug, is_active, sort_order)
select 'T-Shirts', 't-shirts', true, 40
where not exists (
  select 1 from public.category_master where lower(slug) = lower('t-shirts')
);

insert into public.category_master (name, slug, is_active, sort_order)
select 'Lowers', 'lowers', true, 50
where not exists (
  select 1 from public.category_master where lower(slug) = lower('lowers')
);

insert into public.category_master (name, slug, is_active, sort_order)
select 'Shirts', 'shirts', true, 60
where not exists (
  select 1 from public.category_master where lower(slug) = lower('shirts')
);

insert into public.category_master (name, slug, is_active, sort_order)
select 'Accessories', 'accessories', true, 70
where not exists (
  select 1 from public.category_master where lower(slug) = lower('accessories')
);