---
name: Operational Precision
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#515f74'
  on-secondary: '#ffffff'
  secondary-container: '#d5e3fd'
  on-secondary-container: '#57657b'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#00174b'
  on-tertiary-container: '#497cff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#d5e3fd'
  secondary-fixed-dim: '#b9c7e0'
  on-secondary-fixed: '#0d1c2f'
  on-secondary-fixed-variant: '#3a485c'
  tertiary-fixed: '#dbe1ff'
  tertiary-fixed-dim: '#b4c5ff'
  on-tertiary-fixed: '#00174b'
  on-tertiary-fixed-variant: '#003ea8'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
  status-ready: '#059669'
  status-ready-bg: '#ECFDF5'
  status-ready-border: '#A7F3D0'
  status-review: '#D97706'
  status-review-bg: '#FFFBEB'
  status-review-border: '#FDE68A'
  status-failed: '#E11D48'
  status-failed-bg: '#FFF1F2'
  status-failed-border: '#FECDD3'
  status-draft: '#64748B'
  status-draft-bg: '#F1F5F9'
  status-draft-border: '#E2E8F0'
  surface-canvas: '#F8FAFC'
  surface-panel: '#FFFFFF'
  surface-subtle: '#F1F5F9'
  border-subtle: '#E2E8F0'
  border-strong: '#CBD5E1'
typography:
  headline-xl:
    fontFamily: Geist, sans-serif
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Geist, sans-serif
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist, sans-serif
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Geist, sans-serif
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist, sans-serif
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-md:
    fontFamily: Geist, sans-serif
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-sm:
    fontFamily: Geist, sans-serif
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-md:
    fontFamily: Geist, sans-serif
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Geist, sans-serif
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
  data-tabular:
    fontFamily: Geist, monospace
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 16px
  data-tabular-bold:
    fontFamily: Geist, monospace
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  space-xxs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-base: 1rem
  space-lg: 1.25rem
  space-xl: 1.5rem
  space-2xl: 2rem
  space-3xl: 3rem
  sidebar-width: 240px
  table-row-compact: 36px
  table-row-standard: 44px
---

## Brand & Style

This design system is engineered for dense, mission-critical e-commerce operations. Built specifically for business operators synchronizing product catalogs between disparate platforms, the aesthetic prioritizes precision, speed, and cognitive clarity over decorative novelty. 

The emotional tone is calm, composed, and institutional—resembling high-grade industrial software, financial terminals, and logistics dispatch dashboards. It treats data density as a feature rather than an obstruction, providing operators with high visual throughput while systematically preventing user fatigue.

### Visual Principles
- **Functional Utilitarianism**: Form strictly follows operational efficiency. No unnecessary graphic ornamentation, illustrative placeholders, neon accents, or novelty gradients.
- **Structural Integrity**: Surfaces rely on crisp hairline dividers (`1px`), clean geometric containment, and precise contrast ratios rather than ambient blurs or excessive drop shadows.
- **Explicit Hierarchy**: Clear visual anchors prioritize immediate workflow status, validation errors, and clear next steps over passive metadata.
- **Operational Restraint**: Visual excitement is deliberately curbed. Semantic colors are deployed strictly for validation states, process health, and immediate blocking tasks.

## Colors

The color system is calibrated for sustained daily operation in natural and corporate lighting. Built around zinc-slate neutrals, it uses high-contrast dark tones for control surfaces and reserve chromatic saturation solely for operational states.

### Color Hierarchy & Roles
- **Primary (`#0F172A`)**: Deep functional slate. Applied to key interactive controls (primary action buttons, selected states, critical tabs), brand indicators, and high-emphasis typography.
- **Secondary (`#334155`)**: Slate-700. Used for supporting action controls, active secondary states, navigation links, and structural table column headers.
- **Tertiary (`#2563EB`)**: Balanced cobalt blue. Reserved strictly for interactive utilities, deep links, keyboard focus rings, and selection indicators.
- **Neutral (`#64748B`)**: Structural slate gray. Governs inactive labels, supporting field text, meta descriptions, and structural borders.

### Semantic Status Colors
Status colors must never appear unanchored without accompanying text or descriptive icons:
- **Ready for Shopee (`#059669`)**: Emerald green indicates complete validation, compliant attributes, and sync-readiness.
- **Needs Review (`#D97706`)**: Amber indicates blocking data gaps, unmapped categories, or price margin anomalies.
- **Failed (`#E11D48`)**: Rose-red indicates API synchronization errors, schema rejection, or invalid credentials.
- **Draft / Inactive (`#64748B`)**: Slate neutral indicates stashed, unparsed, or staged catalog states.

## Typography

The typography is unified entirely under the Geist typeface to leverage its precise geometric balance, high legibility at micro scales, and monospaced numerical figures. 

### Typographic Rules
- **Tabular Numerics**: All inventory counts, currency figures (IDR/USD), weights, SKUs, and platform IDs must enforce `font-variant-numeric: tabular-nums` to ensure exact column alignment in dense data grids.
- **Editorial Scale**: Avoid oversized marketing headlines. The highest level (`headline-xl` at 28px) is strictly reserved for primary operational views. Page titles remain grounded at 22px (`headline-lg`).
- **Hierarchy through Weight & Color**: Differentiate context using font weight (`500` and `600`) and value steps (Slate-900 to Slate-500) rather than disproportionate font size shifts.
- **Uppercase Labels**: Micro labels (`label-sm`) may utilize uppercase tracking (`letter-spacing: 0.04em`) exclusively for table column sorting tags, schema pill badges, and input prefixes.

## Layout & Spacing

This layout system is engineered desktop-first, structured around a static or collapsible 240px utility sidebar and a high-density, multi-pane content region.

### Layout Principles
- **Grid Structure**: Operational surfaces use an edge-to-edge container model rather than a fixed centered reading column. Content panes span the entire viewport minus the persistent 240px navigation sidebar, bounded only by a generous maximum width (`1600px`) on ultra-wide displays.
- **Two-Column Review Pane**: Product detail views employ an asymmetric 5:7 split view:
  - **Left Pane (Comparison & Identity)**: JakMall source images, original attributes, vendor references, and source metadata.
  - **Right Pane (Shopee Transformation)**: Editable Shopee category tree, mapped attributes, validated logistics, variant matrix, and pricing formulas.
- **Forms & Grouping**: Avoid wrapping individual form groups inside nested cards. Group form domains using crisp horizontal border dividers (`border-subtle`) accompanied by a sticky section index or clear category headings.
- **Table Density**: Tables use a compact 36px row height for bulk views and 44px for rows featuring image thumbnails or multi-line validation errors.

## Elevation & Depth

Visual depth is conveyed through low-contrast outlines and tonal planes rather than prominent box shadows or layered blurs.

### Elevation Levels
- **Canvas Base (`#F8FAFC`)**: The default window background beneath all operational panels and sidebars.
- **Surface Panels (`#FFFFFF`)**: Pure white sheets reserved for work surfaces: tables, configuration panes, side sheets, and explicit metric cards.
- **Hairline Borders (`1px solid #E2E8F0`)**: Primary method of boundary delineation. Every card, table cell, split pane, and modal boundary uses crisp hairline boundaries.
- **Elevation-0 (Flat)**: Standard cards, form sections, and inline inspectors sit flush against the canvas with a 1px border.
- **Elevation-1 (Overlay Menus)**: Dropdown selects, popovers, and contextual action menus utilize a subtle micro-shadow: `0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.08)` paired with a `1px` border (`#CBD5E1`).
- **Elevation-2 (Modals & Drawers)**: High-priority operational modals and slide-over panels use: `0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.05)` accompanied by a neutral scrim (`rgba(15, 23, 42, 0.4)`).

## Shapes

The interface embraces a compact, architectural corner radius (level 1 / Soft: `4px` base radius). This produces tight, authoritative forms that maximize usable pixel density and maintain horizontal alignment across stacked form fields and tabular rows.

### Component Radii Rules
- **Inputs, Buttons, Badges**: Strict `4px` border radius (`rounded`).
- **Cards, Modals, Flyout Panels**: `6px` or `8px` border radius (`rounded-md` / `rounded-lg`).
- **Table Outlines**: `6px` exterior corner bounding; interior cells remain strictly squared (`0px`).
- **Image Thumbnails**: `4px` radius with a `1px` inset neutral stroke.
- **Pills**: Circular pills (`rounded-full`) are banned for structural containers and reserved solely for count badges and micro-status indicators.

## Components

### Buttons
- **Primary**: Solid Slate-900 (`#0F172A`) background, white text, 4px radius, 32px height (compact) or 36px (standard). Hover: `#1E293B`. Active: `#020617`. Focus: 2px ring offset `#2563EB`.
- **Secondary**: Crisp white background, `#0F172A` text, 1px border `#CBD5E1`. Hover: `#F8FAFC`. Active: `#F1F5F9`.
- **Destructive**: Rose background `#FFF1F2`, text `#E11D48`, border `1px solid #FECDD3`. Hover: `#FFE4E6`. For final confirmation: Solid `#E11D48` with white text.
- **Ghost / Icon**: Transparent background, text `#475569`. Hover: `#F1F5F9`.

### Status Badges
Status badges are compact (height: 20px, text: 11px font-weight 500, padding: 0 6px, radius: 4px). Every badge must pair an icon with concise wording:
- **Ready for Shopee**: Border `#A7F3D0`, background `#ECFDF5`, text `#065F46`, icon `CheckCircle2`.
- **Needs Review**: Border `#FDE68A`, background `#FFFBEB`, text `#92400E`, icon `AlertTriangle`.
- **Failed**: Border `#FECDD3`, background `#FFF1F2`, text `#9F1239`, icon `XCircle`.
- **Draft**: Border `#E2E8F0`, background `#F8FAFC`, text `#475569`, icon `Clock`.

### Form Fields & Inputs
- **Text & Number Inputs**: Height 32px (compact) or 36px (standard). Border `1px solid #CBD5E1`, background `#FFFFFF`, text `#0F172A`, font size 13px. Placeholder: `#94A3B8`. Focus: border `#2563EB`, ring 1px `#2563EB`.
- **Monetary & Dimensional Inputs**: Prefix/suffix containers fixed with Slate-100 background, 1px right/left border `#CBD5E1`, tabular monospace figures.
- **Validation Errors**: Direct 12px error note beneath the input with an `AlertCircle` icon in `#E11D48`; input border transitions to `#E11D48`.

### Checkboxes & Selection Controls
- **Checkboxes**: 16x16px, 3px border radius. Unchecked: 1.5px border `#94A3B8`. Checked: solid `#0F172A` fill with white checkmark icon.
- **Radio Buttons**: 16x16px round control. Checked: solid `#0F172A` ring with a centered 6px dot.

### Data Tables
- **Header**: Height 32px, background `#F8FAFC`, border bottom `1px solid #E2E8F0`, typography `label-sm` in Slate-600.
- **Body Row**: Height 38px to 44px, alternating hover state `#F8FAFC`. Active/Selected row: `#F1F5F9` with a 2px left border accent in `#0F172A`.
- **Numeric Columns**: Text align right, monospace figures (`data-tabular`).

### Readiness Checklist
- Displays category validation rules prior to Shopee export.
- Checklist rows feature clear passing (`Check` in `#059669`) or missing (`AlertCircle` in `#D97706`) icons, explicit rule name, current value, and an inline `Resolve` text link triggering instant focus on the relevant field.