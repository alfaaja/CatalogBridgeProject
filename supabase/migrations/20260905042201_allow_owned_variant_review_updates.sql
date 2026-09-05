begin;

alter table public.product_variants enable row level security;

revoke update on table public.product_variants
from public, anon, authenticated, service_role;

grant update (
  selling_price,
  stock,
  sku
) on table public.product_variants to authenticated;

create policy product_variants_update_owned
on public.product_variants
for update
to authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = product_variants.product_id
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
    where products.id = product_variants.product_id
      and products.owner_id = (select auth.uid())
      and products.status = 'REVIEW_REQUIRED'
  )
  and coalesce(
    (select (auth.jwt() ->> 'is_anonymous')::boolean),
    false
  ) = false
);

commit;
