# Design System

## Existing baseline

The project was initialized with shadcn/ui using the **Nova** preset, **Lucide** icons, and **Geist** typography. Preserve that baseline unless there is a concrete reason to change it.

## Character

- professional internal commerce operations tool;
- restrained;
- clear;
- moderately dense;
- product imagery provides visual richness;
- visual hierarchy comes from typography, spacing, borders, and state — not decoration.

## Anti-AI-slop rules

### Do not

- giant gradient hero;
- generic SaaS landing sections in the logged-in product;
- blue-purple-pink gradients as default visual identity;
- glowing buttons;
- glassmorphism panels without functional reason;
- floating abstract blobs;
- huge border radius everywhere;
- nest Cards simply to create padding;
- create fake dashboards/charts/percent improvements;
- use emoji for navigation icons;
- apply animation to every interaction;
- use overly cute copy in operational/error states;
- hide important actions behind hover-only controls;
- use monochrome low-contrast text for everything.

### Do

- use clear page titles and short descriptions;
- use one obvious primary action per state;
- use tables for operational collections;
- reserve cards for semantically bounded objects such as metrics or previews;
- use section headings + dividers for forms;
- keep shadows subtle;
- use semantic success/warning/error styling;
- pair status color with icon/text;
- keep product image quality and aspect ratios consistent;
- preserve whitespace without making the UI sparse.

## Typography

Use Geist from the existing setup.

Recommended hierarchy, adjusted responsively:

- page title: ~24–32px;
- section title: ~18–20px;
- body/UI: ~14px;
- metadata: ~12–13px.

Avoid 64–80px marketing headlines in operational screens.

## Color

Use neutral surfaces with one restrained primary accent. Status colors have semantic meaning:

- success: ready/completed;
- amber: needs review/warning;
- red: failed/destructive;
- gray: pending/inactive.

Do not rely on color alone.

## Radius and shadows

Use the preset defaults unless a design decision changes them. Avoid “every component is a soft bubble.”

## Icons

Lucide icons only unless a real need exists. Prefer recognizable icons and pair ambiguous icons with labels/tooltips.

## Motion

Motion is optional and must communicate state. Prefer CSS transitions; do not add a motion library solely for flourish.
