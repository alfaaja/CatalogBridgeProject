# CatalogBridge Codex Blueprint

This bundle is the project-specific source of truth for the **JakMall → Shopee Product Automation** technical assessment.

## Important: do not overwrite ECC files blindly

The repository already has ECC installed and may already contain `AGENTS.md`, `CLAUDE.md`, `.codex/`, `.agents/skills/`, hooks, rules, or other ECC-managed files.

**Do not replace those files with this bundle.** Instead:

1. Copy `docs/` and `design/` into the repository root.
2. Keep the existing ECC `AGENTS.md` and `CLAUDE.md` intact.
3. Merge the contents of `AGENTS-PROJECT-ADDENDUM.md` into the bottom of the existing root `AGENTS.md`, or ask Codex to perform a conservative merge.
4. Use `CODEX-BOOTSTRAP-PROMPT.md` for the first Codex session.
5. Do not tell Codex to implement everything at once. Follow `docs/24-IMPLEMENTATION-PLAN.md` milestone by milestone.

## Current technical baseline

The project has already been initialized with:

- Next.js + TypeScript + App Router
- Tailwind CSS
- shadcn/ui using the Nova preset, Lucide icons, and Geist
- Supabase JS / SSR dependencies
- Zod
- Cheerio
- React Hook Form
- testing dependencies
- Supabase project connection verified through a health endpoint
- `npm run lint` passing
- `npm run build` passing

Treat `package.json` as authoritative for exact versions. Do not upgrade dependencies unless a concrete requirement or bug justifies it.

## Product objective

A non-technical business operator should be able to:

1. enter one or more public JakMall product URLs;
2. import product information;
3. review and correct the normalized product data;
4. map or confirm Shopee-required fields;
5. prepare a Shopee-ready listing with minimal repetitive manual input;
6. see clear success, review-required, and failure states;
7. use the application through a public deployment, not localhost.

## Quality objective

This is a small PoC that must actually work. It should feel like a deliberate internal commerce operations tool, **not an AI-generated SaaS demo**.

Read `docs/00-DOC-MAP.md` before loading more context.
