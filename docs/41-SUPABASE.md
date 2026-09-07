# Supabase Integration

## Current state

The existing Next.js project has already successfully reached the Supabase project through a safe health endpoint using the publishable key.

Do not replace that working setup without evidence.

## Client separation

- browser client for user-session-aware browser operations;
- server client for server components/routes/actions;
- privileged service-role/secret client only if a concrete server-only use case requires it.

## Environment

Use:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Never put a secret/service-role key under `NEXT_PUBLIC_`.

## Database

Use migrations/SQL committed to the repository once schema implementation begins. Avoid undocumented dashboard-only schema changes.

## RLS

Define and test policies before exposing application data through the public deployment.

## Auth

For a simple demo, email/password is enough if auth is enabled. Do not spend deadline time on social login/magic links unless they solve a real issue.

## Storage

Use only when stable hosted product-image copies are required. Do not upload every image automatically before the integration need is proven.

## SDK errors

Convert provider-specific errors into domain/application error codes rather than rendering raw Supabase error objects to business users.

## Shopee upload jobs

`shopee_upload_jobs` stores one bounded, allowlisted READY snapshot per current
fingerprint. Authenticated users can select owned rows, insert only the snapshot
columns, and update only runner status/evidence columns. `owner_id` defaults from
`auth.uid()` and cannot be supplied through the web action. RLS also verifies
ownership of the parent product and its READY revision. There is no anon grant,
delete grant, service-role client, credential field, cookie field, or published
status.
