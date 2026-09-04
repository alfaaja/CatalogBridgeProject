# Project Brief

## Name

**CatalogBridge** — JakMall → Shopee Product Automation.

The repository name may remain `jakmall-shopee-automation`; the UI product name can be CatalogBridge.

## Business problem

Moving product catalog data manually from JakMall to Shopee Seller is repetitive, slow, and error-prone. The PoC should reduce that repetitive work while remaining inexpensive, understandable, and demonstrable.

## Primary user

A non-technical e-commerce/business operator or reviewer.

The user should not need to understand scraping, DOM selectors, JSON, ETL, API authentication, database schemas, or browser automation.

## Primary outcome

Given a valid public JakMall product URL, the system should obtain useful product data, normalize it, let the user review fields that cannot safely be mapped automatically, and prepare the product for a Shopee listing with minimal duplicate manual entry.

## Success principles

1. End-to-end proof matters more than feature count.
2. Reliability and explainability matter more than architectural novelty.
3. Cost should remain near zero for a PoC where practical.
4. The hosted app must be usable by a non-developer.
5. AI-assisted development is allowed, but the candidate must understand and explain the implementation.
6. Do not over-engineer.

## Chosen baseline stack

- Next.js + TypeScript
- App Router
- Tailwind CSS
- shadcn/ui, Nova preset
- Geist typography
- Lucide icons
- Supabase (Postgres/Auth/Storage as needed)
- Zod
- Cheerio
- React Hook Form
- Vitest/testing-library for important logic
- Vercel target deployment

Exact versions come from `package.json`, never from this document.
