-- Dev-only starter users for the app-managed auth flow.
-- Do not run this seed in production.

insert into public.users (id, name, email, password_hash, role, is_active)
select
  '11111111-1111-4111-8111-111111111111',
  'Asha Admin',
  'admin@local.shop',
  'scrypt$cc6C4DEhlFsEpF31KTDu3g$gvWrPzKf5b0Rre_nVjJpt8bf5tRzQuLbPcK5Kk_4Q9A5HzlvjswcmNDUxQhAmWnRVG7wDCFwIc3oj_2tmDZEEg',
  'admin',
  true
where not exists (
  select 1 from public.users where lower(email) = lower('admin@local.shop')
);

insert into public.users (id, name, email, password_hash, role, is_active)
select
  '22222222-2222-4222-8222-222222222222',
  'Samar Staff',
  'staff@local.shop',
  'scrypt$lcOQjfrqRgagpX_j6qY0Gg$Efmygw9qJcrEeguJ_iexX6T4dNWJFSFGbnj9bvZtbf7_9q0otXWqn6d8wqauNwbhntjULPDOGpsie4oyExx6ng',
  'staff',
  true
where not exists (
  select 1 from public.users where lower(email) = lower('staff@local.shop')
);

insert into public.users (id, name, email, password_hash, role, is_active)
select
  '33333333-3333-4333-8333-333333333333',
  'Vani Viewer',
  'viewer@local.shop',
  'scrypt$hSnlfOZ6uyGEdJj63hJ2mA$AL4u-OIfgP7nLCLmNMXR-zW4FHntDkWUc2eEX7dUvUCn4N7AT_nWr2MVgEuTJJBtm36OVwD6oP7OyMh8DV7o8g',
  'viewer',
  true
where not exists (
  select 1 from public.users where lower(email) = lower('viewer@local.shop')
);