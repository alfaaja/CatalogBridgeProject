# Stitch Design Brief

Use Google Stitch for **visual exploration and prototyping**, not as the code/architecture authority.

Stitch may receive `design/DESIGN.md` plus focused screen prompts. Explore a few directions, select one, then Codex recreates the approved design using the existing shadcn/Tailwind project.

## Product context

CatalogBridge imports public JakMall product data, lets a business operator review it, and prepares a Shopee-ready listing.

## Primary user

Non-technical e-commerce/business operator.

## Core workflow

```text
Dashboard
  → Import Product
  → Import Progress
  → Product Review
  → Shopee Preview
  → Prepared/Success
```

## Desired visual character

- modern B2B operations UI;
- restrained and serious;
- product imagery provides visual richness;
- high clarity and moderate information density;
- obvious primary action;
- useful empty/loading/error states.

## Anti-slop requirements

Do not generate:

- marketing landing page inside the app;
- gradient hero;
- neon/glass aesthetic;
- huge hero copy;
- random charts;
- excessive cards;
- fake metrics;
- AI sparkles/badges;
- decorative 3D illustration;
- generic finance dashboard styling unrelated to products.

## Stitch workflow

1. Import/reference `design/DESIGN.md` if supported.
2. Generate Dashboard first.
3. Critique it against `design/UI-REFERENCE-CHECKLIST.md`.
4. Iterate until hierarchy feels deliberate.
5. Generate Product List and Product Review in the same system.
6. Generate Shopee Preview last, based on the approved product-detail language.
7. Prototype transitions only after screens are visually stable.
8. Export screenshots/design reference; generated code is optional reference only.

## Handoff to Codex

Do not tell Codex “copy Stitch code.”

Give Codex approved screenshots/reference plus:

- `docs/13-UI-UX.md`;
- `docs/14-DESIGN-SYSTEM.md`;
- `design/DESIGN.md`.

Codex should implement with existing shadcn components and project tokens.
