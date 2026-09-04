# Deployment

## Target topology

```text
GitHub repository
      ↓
Vercel — Next.js web application
      ↓
Supabase — Postgres/Auth/Storage
```

This topology is chosen for low operational overhead and a public review URL.

## Deployment steps

1. push a verified branch to GitHub;
2. import/connect repository in Vercel;
3. configure required environment variables in Vercel;
4. ensure `.env.local` remains local only;
5. run/verify database migrations in the intended Supabase project;
6. deploy preview;
7. test critical flow on the deployed URL;
8. promote/use production URL only after release checklist passes.

## Vercel environment variables

At minimum, mirror the safe application variables documented in `21-ENVIRONMENT.md`.

Never expose server secrets through `NEXT_PUBLIC_`.

## Database migrations

Migrations must be reproducible. Do not rely on “I clicked something in Supabase dashboard” as the only schema history.

## Rollback

For PoC:

- retain previous successful Vercel deployment;
- revert application commit if a release breaks;
- avoid destructive database migrations near the demo;
- take manual/export backup before risky schema changes if needed.

## Deployment proof

A production deployment is successful only if the public URL loads and the critical import/review flow works against the intended Supabase environment.
