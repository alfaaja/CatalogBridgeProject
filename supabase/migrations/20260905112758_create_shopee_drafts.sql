begin;

create table public.shopee_drafts (
  product_id uuid primary key
    references public.products(id) on delete cascade,
  title_override text,
  description_override text,
  category_id text,
  category_path text,
  category_confirmed boolean not null default false,
  category_attributes jsonb not null default '[]'::jsonb,
  category_attributes_reviewed boolean not null default false,
  dangerous_product text not null default 'UNCONFIRMED',
  condition text not null default 'UNCONFIRMED',
  preorder text not null default 'UNCONFIRMED',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shopee_drafts_title_override_check
    check (
      title_override is null
      or (btrim(title_override) <> '' and char_length(title_override) <= 255)
    ),
  constraint shopee_drafts_description_override_check
    check (
      description_override is null
      or (
        btrim(description_override) <> ''
        and char_length(description_override) <= 3000
      )
    ),
  constraint shopee_drafts_category_id_check
    check (
      category_id is null
      or (btrim(category_id) <> '' and char_length(category_id) <= 200)
    ),
  constraint shopee_drafts_category_path_check
    check (
      category_path is null
      or (btrim(category_path) <> '' and char_length(category_path) <= 500)
    ),
  constraint shopee_drafts_category_confirmation_check
    check (
      category_confirmed = false
      or nullif(btrim(category_path), '') is not null
    ),
  constraint shopee_drafts_category_attributes_check
    check (
      jsonb_typeof(category_attributes) = 'array'
      and jsonb_array_length(category_attributes) <= 50
    ),
  constraint shopee_drafts_dangerous_product_check
    check (dangerous_product in ('UNCONFIRMED', 'NO', 'YES')),
  constraint shopee_drafts_condition_check
    check (condition in ('UNCONFIRMED', 'NEW', 'USED')),
  constraint shopee_drafts_preorder_check
    check (preorder in ('UNCONFIRMED', 'NO', 'YES'))
);

create trigger shopee_drafts_set_updated_at
before update on public.shopee_drafts
for each row execute function public.set_catalogbridge_updated_at();

alter table public.shopee_drafts enable row level security;

revoke all on table public.shopee_drafts
from public, anon, authenticated, service_role;

grant select on table public.shopee_drafts to authenticated;

grant insert (
  product_id,
  title_override,
  description_override,
  category_id,
  category_path,
  category_confirmed,
  category_attributes,
  category_attributes_reviewed,
  dangerous_product,
  condition,
  preorder
) on public.shopee_drafts to authenticated;

grant update (
  title_override,
  description_override,
  category_id,
  category_path,
  category_confirmed,
  category_attributes,
  category_attributes_reviewed,
  dangerous_product,
  condition,
  preorder
) on public.shopee_drafts to authenticated;

create policy shopee_drafts_select_owned
on public.shopee_drafts
for select
to authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = shopee_drafts.product_id
      and products.owner_id = (select auth.uid())
  )
  and coalesce(
    (select (auth.jwt() ->> 'is_anonymous')::boolean),
    false
  ) = false
);

create policy shopee_drafts_insert_owned_review
on public.shopee_drafts
for insert
to authenticated
with check (
  exists (
    select 1
    from public.products
    where products.id = shopee_drafts.product_id
      and products.owner_id = (select auth.uid())
      and products.status = 'REVIEW_REQUIRED'
  )
  and coalesce(
    (select (auth.jwt() ->> 'is_anonymous')::boolean),
    false
  ) = false
);

create policy shopee_drafts_update_owned_review
on public.shopee_drafts
for update
to authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = shopee_drafts.product_id
      and products.owner_id = (select auth.uid())
      and products.status = 'REVIEW_REQUIRED'
  )
  and coalesce(
    (select (auth.jwt() ->> 'is_anonymous')::boolean),
    false
  ) = false
)
with check (
  exists (
    select 1
    from public.products
    where products.id = shopee_drafts.product_id
      and products.owner_id = (select auth.uid())
      and products.status = 'REVIEW_REQUIRED'
  )
  and coalesce(
    (select (auth.jwt() ->> 'is_anonymous')::boolean),
    false
  ) = false
);

commit;
