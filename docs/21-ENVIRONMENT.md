# Environment

## Runtime

Use the Node/npm versions compatible with the existing repository lockfile and dependencies. Do not pin a version in documentation without checking the current project.

## Required local setup

- Node.js
- npm
- Git
- existing ECC/Codex environment
- Supabase project

## Environment variables

Current public client connection:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Additional variables must be documented here when introduced.

Never put actual values in committed docs.

## Development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run lint
npm run build
```

## Existing health route

The repository currently has a Supabase health route used to verify basic project connectivity. Keep health responses free of secrets and unnecessary environment detail.
