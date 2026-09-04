begin;

create function public.set_catalogbridge_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.products (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  source_platform text not null default 'jakmall',
  canonical_source_url text not null,
  source_product_identifier text,
  title text,
  description text,
  source_price numeric(14, 0),
  selling_price numeric(14, 0),
  currency_code text not null default 'IDR',
  sku text,
  gtin text,
  stock integer,
  source_category text,
  brand text,
  weight_grams integer,
  length_cm numeric(10, 2),
  width_cm numeric(10, 2),
  height_cm numeric(10, 2),
  attributes jsonb not null default '{}'::jsonb,
  variant_axes jsonb not null default '[]'::jsonb,
  raw_source_data jsonb not null default '{}'::jsonb,
  status text not null default 'PENDING',
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_owner_id_fkey
    foreign key (owner_id) references auth.users(id) on delete cascade,
  constraint products_source_platform_check
    check (source_platform = 'jakmall'),
  constraint products_canonical_source_url_check
    check (btrim(canonical_source_url) <> ''),
  constraint products_source_product_identifier_check
    check (
      source_product_identifier is null
      or btrim(source_product_identifier) <> ''
    ),
  constraint products_title_check
    check (title is null or btrim(title) <> ''),
  constraint products_source_price_check
    check (source_price is null or source_price >= 0),
  constraint products_selling_price_check
    check (selling_price is null or selling_price >= 0),
  constraint products_currency_code_check
    check (currency_code = 'IDR'),
  constraint products_stock_check
    check (stock is null or stock >= 0),
  constraint products_weight_grams_check
    check (weight_grams is null or weight_grams >= 0),
  constraint products_length_cm_check
    check (length_cm is null or length_cm >= 0),
  constraint products_width_cm_check
    check (width_cm is null or width_cm >= 0),
  constraint products_height_cm_check
    check (height_cm is null or height_cm >= 0),
  constraint products_attributes_object_check
    check (jsonb_typeof(attributes) = 'object'),
  constraint products_variant_axes_array_check
    check (jsonb_typeof(variant_axes) = 'array'),
  constraint products_raw_source_data_object_check
    check (jsonb_typeof(raw_source_data) = 'object'),
  constraint products_status_check
    check (
      status in ('PENDING', 'IMPORTING', 'REVIEW_REQUIRED', 'READY', 'FAILED')
    ),
  constraint products_error_state_check
    check (
      (
        status = 'FAILED'
        and nullif(btrim(error_code), '') is not null
        and nullif(btrim(error_message), '') is not null
      )
      or (
        status <> 'FAILED'
        and error_code is null
        and error_message is null
      )
    ),
  constraint products_owner_source_url_key
    unique (owner_id, source_platform, canonical_source_url)
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null,
  source_url text not null,
  position integer not null,
  is_primary boolean not null default false,
  kind text not null default 'product',
  created_at timestamptz not null default now(),
  constraint product_images_product_id_fkey
    foreign key (product_id) references public.products(id) on delete cascade,
  constraint product_images_source_url_check
    check (btrim(source_url) <> ''),
  constraint product_images_position_check
    check (position >= 0),
  constraint product_images_kind_check
    check (kind in ('product', 'promotional')),
  constraint product_images_product_position_key
    unique (product_id, position)
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null,
  source_variant_identifier text,
  position integer not null,
  option_values jsonb not null default '{}'::jsonb,
  source_price numeric(14, 0),
  selling_price numeric(14, 0),
  stock integer,
  sku text,
  image_source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_variants_product_id_fkey
    foreign key (product_id) references public.products(id) on delete cascade,
  constraint product_variants_source_identifier_check
    check (
      source_variant_identifier is null
      or btrim(source_variant_identifier) <> ''
    ),
  constraint product_variants_position_check
    check (position >= 0),
  constraint product_variants_option_values_object_check
    check (jsonb_typeof(option_values) = 'object'),
  constraint product_variants_source_price_check
    check (source_price is null or source_price >= 0),
  constraint product_variants_selling_price_check
    check (selling_price is null or selling_price >= 0),
  constraint product_variants_stock_check
    check (stock is null or stock >= 0),
  constraint product_variants_product_position_key
    unique (product_id, position)
);

create table public.process_logs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null,
  stage text not null,
  status text not null,
  message text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint process_logs_product_id_fkey
    foreign key (product_id) references public.products(id) on delete cascade,
  constraint process_logs_stage_check
    check (btrim(stage) <> ''),
  constraint process_logs_status_check
    check (status in ('started', 'success', 'warning', 'failed')),
  constraint process_logs_message_check
    check (btrim(message) <> ''),
  constraint process_logs_details_object_check
    check (jsonb_typeof(details) = 'object')
);

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_catalogbridge_updated_at();

create trigger product_variants_set_updated_at
before update on public.product_variants
for each row execute function public.set_catalogbridge_updated_at();

create index products_owner_updated_at_idx
  on public.products (owner_id, updated_at desc, id);

create unique index product_images_one_primary_idx
  on public.product_images (product_id)
  where is_primary;

create index process_logs_product_created_at_idx
  on public.process_logs (product_id, created_at desc, id);

alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.process_logs enable row level security;

revoke all on table
  public.products,
  public.product_images,
  public.product_variants,
  public.process_logs
from public, anon, authenticated, service_role;

revoke all on function public.set_catalogbridge_updated_at()
from public, anon, authenticated, service_role;

revoke create on schema public from public, anon, authenticated, service_role;

grant usage on schema public to authenticated;
grant select on table
  public.products,
  public.product_images,
  public.product_variants
to authenticated;

grant insert (
  source_platform,
  canonical_source_url,
  source_product_identifier,
  title,
  status
) on public.products to authenticated;

grant update (
  title,
  description,
  source_price,
  selling_price,
  sku,
  gtin,
  stock,
  source_category,
  brand,
  weight_grams,
  length_cm,
  width_cm,
  height_cm,
  attributes,
  variant_axes,
  raw_source_data,
  status,
  error_code,
  error_message
) on public.products to authenticated;

grant insert (
  product_id,
  source_url,
  position,
  is_primary,
  kind
) on public.product_images to authenticated;

grant insert (
  product_id,
  source_variant_identifier,
  position,
  option_values,
  source_price,
  selling_price,
  stock,
  sku,
  image_source_url
) on public.product_variants to authenticated;

grant select on table public.process_logs to authenticated;
grant insert (
  product_id,
  stage,
  status,
  message,
  details
) on public.process_logs to authenticated;

create policy products_select_owned
on public.products
for select
to authenticated
using (
  owner_id = (select auth.uid())
  and coalesce(
    (select (auth.jwt() ->> 'is_anonymous')::boolean),
    false
  ) = false
);

create policy products_insert_owned
on public.products
for insert
to authenticated
with check (
  owner_id = (select auth.uid())
  and coalesce(
    (select (auth.jwt() ->> 'is_anonymous')::boolean),
    false
  ) = false
);

create policy products_update_owned
on public.products
for update
to authenticated
using (
  owner_id = (select auth.uid())
  and coalesce(
    (select (auth.jwt() ->> 'is_anonymous')::boolean),
    false
  ) = false
)
with check (
  owner_id = (select auth.uid())
  and coalesce(
    (select (auth.jwt() ->> 'is_anonymous')::boolean),
    false
  ) = false
);

create policy product_images_select_owned
on public.product_images
for select
to authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = product_images.product_id
      and products.owner_id = (select auth.uid())
  )
);

create policy product_images_insert_owned
on public.product_images
for insert
to authenticated
with check (
  exists (
    select 1
    from public.products
    where products.id = product_images.product_id
      and products.owner_id = (select auth.uid())
  )
);

create policy product_variants_select_owned
on public.product_variants
for select
to authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = product_variants.product_id
      and products.owner_id = (select auth.uid())
  )
);

create policy product_variants_insert_owned
on public.product_variants
for insert
to authenticated
with check (
  exists (
    select 1
    from public.products
    where products.id = product_variants.product_id
      and products.owner_id = (select auth.uid())
  )
);

create policy process_logs_select_owned
on public.process_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = process_logs.product_id
      and products.owner_id = (select auth.uid())
  )
);

create policy process_logs_insert_owned
on public.process_logs
for insert
to authenticated
with check (
  exists (
    select 1
    from public.products
    where products.id = process_logs.product_id
      and products.owner_id = (select auth.uid())
  )
);

commit;
