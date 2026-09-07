begin;

create table public.shopee_upload_jobs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null,
  owner_id uuid not null default auth.uid(),
  manifest_fingerprint text not null,
  ready_revision timestamptz not null,
  manifest jsonb not null,
  status text not null default 'QUEUED',
  safe_error_code text,
  safe_message text,
  seller_product_reference text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint shopee_upload_jobs_product_id_fkey
    foreign key (product_id) references public.products(id) on delete cascade,
  constraint shopee_upload_jobs_owner_id_fkey
    foreign key (owner_id) references auth.users(id) on delete cascade,
  constraint shopee_upload_jobs_fingerprint_check
    check (manifest_fingerprint ~ '^[a-f0-9]{64}$'),
  constraint shopee_upload_jobs_manifest_check
    check (
      jsonb_typeof(manifest) = 'object'
      and octet_length(manifest::text) <= 100000
      and manifest ->> 'schemaVersion' = '1'
      and manifest ->> 'productId' = product_id::text
      and manifest ->> 'snapshotFingerprint' = manifest_fingerprint
      and (manifest ->> 'readyRevision')::timestamptz = ready_revision
    ),
  constraint shopee_upload_jobs_status_check
    check (
      status in (
        'QUEUED',
        'WAITING_FOR_RUNNER',
        'AUTH_REQUIRED',
        'RUNNING',
        'NEEDS_USER_ACTION',
        'SAVED_ARCHIVED',
        'FAILED'
      )
    ),
  constraint shopee_upload_jobs_safe_error_code_check
    check (
      safe_error_code is null
      or (
        char_length(safe_error_code) <= 100
        and safe_error_code ~ '^[A-Z][A-Z0-9_]*$'
      )
    ),
  constraint shopee_upload_jobs_safe_message_check
    check (
      safe_message is null
      or (
        nullif(btrim(safe_message), '') is not null
        and char_length(safe_message) <= 500
      )
    ),
  constraint shopee_upload_jobs_seller_reference_check
    check (
      seller_product_reference is null
      or (
        nullif(btrim(seller_product_reference), '') is not null
        and char_length(seller_product_reference) <= 500
      )
    ),
  constraint shopee_upload_jobs_error_state_check
    check (
      (
        status in ('AUTH_REQUIRED', 'NEEDS_USER_ACTION', 'FAILED')
        and safe_error_code is not null
      )
      or (
        status not in ('AUTH_REQUIRED', 'NEEDS_USER_ACTION', 'FAILED')
        and safe_error_code is null
      )
    ),
  constraint shopee_upload_jobs_finish_state_check
    check (
      (
        status in ('SAVED_ARCHIVED', 'FAILED')
        and finished_at is not null
      )
      or (
        status not in ('SAVED_ARCHIVED', 'FAILED')
        and finished_at is null
      )
    )
);

create function public.enforce_shopee_upload_job_transition()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
    or new.product_id is distinct from old.product_id
    or new.owner_id is distinct from old.owner_id
    or new.manifest_fingerprint is distinct from old.manifest_fingerprint
    or new.ready_revision is distinct from old.ready_revision
    or new.manifest is distinct from old.manifest
    or new.created_at is distinct from old.created_at
  then
    raise exception 'immutable upload job fields cannot be changed';
  end if;

  if not (
    (old.status = 'QUEUED' and new.status in ('WAITING_FOR_RUNNER', 'FAILED'))
    or (
      old.status = 'WAITING_FOR_RUNNER'
      and new.status in (
        'AUTH_REQUIRED', 'RUNNING', 'NEEDS_USER_ACTION', 'FAILED'
      )
    )
    or (
      old.status = 'AUTH_REQUIRED'
      and new.status in ('RUNNING', 'NEEDS_USER_ACTION', 'FAILED')
    )
    or (
      old.status = 'RUNNING'
      and new.status in (
        'AUTH_REQUIRED', 'NEEDS_USER_ACTION', 'SAVED_ARCHIVED', 'FAILED'
      )
    )
    or (
      old.status = 'NEEDS_USER_ACTION'
      and new.status in ('RUNNING', 'FAILED')
    )
  ) then
    raise exception 'invalid upload job status transition';
  end if;

  new.started_at = case
    when old.started_at is not null then old.started_at
    when new.status = 'RUNNING' then now()
    else null
  end;
  new.finished_at = case
    when new.status in ('SAVED_ARCHIVED', 'FAILED') then now()
    else null
  end;
  new.updated_at = now();
  return new;
end;
$$;

create trigger shopee_upload_jobs_enforce_transition
before update on public.shopee_upload_jobs
for each row execute function public.enforce_shopee_upload_job_transition();

create index shopee_upload_jobs_owner_status_created_idx
  on public.shopee_upload_jobs (owner_id, status, created_at, id);

create index shopee_upload_jobs_product_created_idx
  on public.shopee_upload_jobs (product_id, created_at desc, id desc);

create unique index shopee_upload_jobs_current_snapshot_key
  on public.shopee_upload_jobs (
    owner_id,
    product_id,
    manifest_fingerprint
  )
  where status <> 'FAILED';

alter table public.shopee_upload_jobs enable row level security;

revoke all on table public.shopee_upload_jobs
from public, anon, authenticated, service_role;

revoke all on function public.enforce_shopee_upload_job_transition()
from public, anon, authenticated, service_role;

grant select on table public.shopee_upload_jobs to authenticated;

grant insert (
  product_id,
  manifest_fingerprint,
  ready_revision,
  manifest
) on public.shopee_upload_jobs to authenticated;

grant update (
  status,
  safe_error_code,
  safe_message,
  seller_product_reference
) on public.shopee_upload_jobs to authenticated;

create policy shopee_upload_jobs_select_owned
on public.shopee_upload_jobs
for select
to authenticated
using (
  (select auth.uid()) is not null
  and owner_id = (select auth.uid())
  and coalesce(
    (select (auth.jwt() ->> 'is_anonymous')::boolean),
    false
  ) = false
  and exists (
    select 1
    from public.products
    where products.id = shopee_upload_jobs.product_id
      and products.owner_id = (select auth.uid())
  )
);

create policy shopee_upload_jobs_insert_owned_ready
on public.shopee_upload_jobs
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and owner_id = (select auth.uid())
  and coalesce(
    (select (auth.jwt() ->> 'is_anonymous')::boolean),
    false
  ) = false
  and exists (
    select 1
    from public.products
    where products.id = shopee_upload_jobs.product_id
      and products.owner_id = (select auth.uid())
      and products.status = 'READY'
      and products.updated_at = shopee_upload_jobs.ready_revision
  )
);

create policy shopee_upload_jobs_update_owned
on public.shopee_upload_jobs
for update
to authenticated
using (
  (select auth.uid()) is not null
  and owner_id = (select auth.uid())
  and coalesce(
    (select (auth.jwt() ->> 'is_anonymous')::boolean),
    false
  ) = false
  and exists (
    select 1
    from public.products
    where products.id = shopee_upload_jobs.product_id
      and products.owner_id = (select auth.uid())
  )
)
with check (
  (select auth.uid()) is not null
  and owner_id = (select auth.uid())
  and coalesce(
    (select (auth.jwt() ->> 'is_anonymous')::boolean),
    false
  ) = false
  and exists (
    select 1
    from public.products
    where products.id = shopee_upload_jobs.product_id
      and products.owner_id = (select auth.uid())
  )
);

commit;
