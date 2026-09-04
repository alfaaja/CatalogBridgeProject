# CatalogBridge Project Addendum for AGENTS.md

> Merge this section into the existing root `AGENTS.md`. Do not remove ECC instructions. ECC governs execution discipline; these project documents govern product-specific truth.

## Project identity

This repository contains **CatalogBridge**, a hosted Proof of Concept that imports public JakMall product data, normalizes it, lets a business user review it, and prepares it for Shopee Seller with minimal repetitive manual work.

## Instruction precedence

When instructions conflict, apply this order:

1. platform/system safety requirements;
2. existing ECC repository/harness instructions;
3. this project addendum;
4. project documents in `docs/` and `design/`;
5. the current user task;
6. reasonable implementation defaults.

Never invent product behavior when a project document already specifies it. If documents genuinely conflict, stop and report the conflict before changing code.

## Required operating pattern

For non-trivial work:

1. inspect the relevant code and `docs/00-DOC-MAP.md`;
2. load only the documents relevant to the task;
3. produce a short plan before editing;
4. implement the smallest coherent slice;
5. run targeted tests plus `npm run lint` and `npm run build` when appropriate;
6. review the diff for correctness, security, UX regressions, and dead code;
7. update documentation only when behavior or an architecture decision actually changed.

Use the installed ECC workflow when available: **plan → test → implement → review → verify**. Do not duplicate or rewrite ECC internals just to satisfy this project.

## Hard constraints

- Use TypeScript for application code.
- Keep the architecture a modular monolith unless the user explicitly changes the decision.
- Use Supabase for the hosted PoC database/auth/storage needs described in the docs.
- Do not add Prisma, Redis, queues, Playwright, Puppeteer, Docker, or new external SaaS dependencies without a documented need.
- `fetch + structured data + Cheerio` is the default JakMall extraction path. Browser automation is a fallback, not the first choice.
- Scraper logic must not live inside UI components.
- Shopee mapping must consume normalized domain data, not raw JakMall DOM structures.
- Preserve raw source data when useful for debugging/reprocessing.
- Never bypass CAPTCHA, OTP, 2FA, authentication, rate limits, or access controls.
- Never commit passwords, cookies, access tokens, service-role keys, database passwords, or `.env.local`.
- Validate external URLs and block SSRF-prone destinations.
- Do not silently swallow errors.
- Do not fabricate “successful upload” states. Proof shown in the UI must correspond to an actual verified step.

## Anti-AI-slop quality bar

The app must look and behave like a deliberate internal commerce tool, not a generic AI-generated SaaS template.

Avoid:

- giant gradient hero sections;
- purple/cyan/pink neon gradients;
- meaningless glassmorphism;
- glowing cards and decorative blobs;
- every section wrapped in a Card;
- card-inside-card nesting without semantic need;
- huge marketing headlines inside an operations dashboard;
- fake analytics, fake revenue, fake charts, or fake “AI insights”;
- excessive badges, shadows, radius, motion, or decorative icons;
- emoji as primary UI icons;
- filler copy such as “supercharge your workflow”;
- visible lorem ipsum, placeholder metrics, or non-functional buttons;
- “AI-powered” labels unless a real AI feature exists;
- generated abstractions or generic frameworks that are not required by the current scope.

Prefer:

- restrained business UI;
- product imagery as the primary visual content;
- strong information hierarchy;
- clear statuses and next actions;
- compact but readable data density;
- tables/lists for collections;
- simple sections with headings and dividers instead of unnecessary Cards;
- subtle borders and shadows;
- semantic status labels in addition to color;
- concise Indonesian/English business copy that a non-technical reviewer understands.

Every visible element must serve at least one of: user comprehension, task completion, system status, or business decision-making. Otherwise remove it.

## Context routing

Read only what the task needs:

- UI/layout: `docs/13-UI-UX.md`, `docs/14-DESIGN-SYSTEM.md`, `design/DESIGN.md`
- Stitch/design exploration: `design/STITCH-BRIEF.md`, `design/STITCH-PROMPTS.md`
- scraper: `docs/10-JAKMALL-SCRAPER.md`, `docs/11-DATA-NORMALIZATION.md`
- database/Supabase: `docs/09-DATABASE.md`, `docs/41-SUPABASE.md`
- Shopee: `docs/12-SHOPEE-INTEGRATION.md`, `docs/39-CATEGORY-MAPPING.md`
- auth/security: `docs/15-AUTH-SECURITY.md`, `docs/35-DATA-PRIVACY.md`
- release/deploy: `docs/22-DEPLOYMENT.md`, `docs/23-PRODUCTION.md`, `docs/33-RELEASE-CHECKLIST.md`
- overall milestone: `docs/24-IMPLEMENTATION-PLAN.md`

## Completion rule

A task is not “done” because code was generated. It is done only when the acceptance criteria for that task pass and the changed surface has been verified.
