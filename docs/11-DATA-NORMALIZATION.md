# Data Normalization

## Goal

Transform irregular source values into predictable domain values while preserving uncertainty.

## Core rules

### Money

Examples:

- `Rp 125.000` → `125000`
- `Rp125.000,00` → `125000`

Never use floating-point math for business decisions when avoidable. Store IDR as integer or well-defined numeric representation.

### Stock

- explicit numeric stock → integer;
- “habis”/unavailable → `0` only when source meaning is unambiguous;
- unknown/not exposed → `null`, not `0`.

### Weight

Normalize to grams.

- `1.2 kg` → `1200`
- `500 g` → `500`
- unknown → `null`.

### Dimensions

Normalize length/width/height to centimeters when source semantics are clear.

### Text

- preserve meaningful line breaks in descriptions;
- trim accidental whitespace;
- do not automatically rewrite source marketing claims;
- sanitize unsafe HTML before rendering;
- do not invent brand, warranty, certification, stock, or specs.

### Variants

Normalize any number of variant axes into:

- axis name;
- options;
- concrete combinations with price/stock/SKU when available.

Do not assume that every combination exists.

## Completeness/review rules

A normalized product can be saved even when incomplete.

Examples that should trigger review:

- missing title;
- missing sellable price;
- no usable product image if Shopee path requires one;
- unresolved Shopee category;
- missing category-required attribute;
- unknown weight when shipping requires it;
- malformed variant matrix.

The UI should explain what the user needs to fix, not simply mark the product “invalid.”
