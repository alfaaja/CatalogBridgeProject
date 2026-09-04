# Documentation Map

This repository intentionally has detailed documentation, but Codex must **not load all files on every task**.

## Always start here

- `01-PROJECT-BRIEF.md`
- `03-PRODUCT-REQUIREMENTS.md`
- `04-SCOPE.md`
- `24-IMPLEMENTATION-PLAN.md`
- root `AGENTS.md`

## Task routing

| Task | Read these documents |
|---|---|
| Architecture change | `07-ARCHITECTURE.md`, `27-DECISIONS.md`, `28-RISK-REGISTER.md` |
| Domain types | `08-DOMAIN-MODEL.md`, `37-STATE-MACHINE.md` |
| Supabase/database | `09-DATABASE.md`, `41-SUPABASE.md`, `15-AUTH-SECURITY.md` |
| JakMall import | `10-JAKMALL-SCRAPER.md`, `11-DATA-NORMALIZATION.md`, `15-AUTH-SECURITY.md` |
| Shopee mapping | `12-SHOPEE-INTEGRATION.md`, `39-CATEGORY-MAPPING.md`, `08-DOMAIN-MODEL.md` |
| Product images | `38-STORAGE-IMAGES.md`, `10-JAKMALL-SCRAPER.md` |
| UI/layout | `13-UI-UX.md`, `14-DESIGN-SYSTEM.md`, `design/DESIGN.md` |
| Stitch | `design/STITCH-BRIEF.md`, `design/STITCH-PROMPTS.md`, `14-DESIGN-SYSTEM.md` |
| Auth/security | `15-AUTH-SECURITY.md`, `35-DATA-PRIVACY.md`, `41-SUPABASE.md` |
| Error handling | `16-ERROR-HANDLING.md`, `17-OBSERVABILITY.md` |
| Testing | `18-TESTING.md`, relevant feature doc |
| Performance | `19-PERFORMANCE.md`, `40-BATCH-RETRY.md` |
| Accessibility | `20-ACCESSIBILITY.md`, `14-DESIGN-SYSTEM.md` |
| Environment | `21-ENVIRONMENT.md` |
| Deployment | `22-DEPLOYMENT.md`, `23-PRODUCTION.md`, `33-RELEASE-CHECKLIST.md` |
| Demo/interview | `31-DEMO-INTERVIEW.md`, `32-TRACEABILITY.md`, `29-COST-MODEL.md` |
| API routes/contracts | `36-API-CONTRACTS.md`, relevant feature doc |

## Source-of-truth policy

If a code behavior and a project document disagree, do not silently choose one. Determine whether the code is unfinished or the document is outdated, then explicitly resolve the discrepancy.
