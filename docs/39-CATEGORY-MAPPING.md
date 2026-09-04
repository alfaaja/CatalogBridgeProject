# Shopee Category & Attribute Mapping

## Problem

Supplier/source category text does not necessarily map 1:1 to Shopee categories. Shopee required attributes vary by selected category.

## P0 policy

- preserve source category;
- provide a Shopee category field in the draft;
- require user confirmation when mapping is uncertain;
- never silently choose a materially different category just to complete the form.

## Mapping record

A future lightweight mapping table can contain:

- normalized source category/key;
- Shopee category id/name;
- confidence/status;
- last confirmed timestamp;
- optional category attribute mapping rules.

## Attributes

Dynamic attributes should be represented as structured key/value data, with metadata when required:

```ts
type MappedAttribute = {
  sourceKey?: string
  shopeeKey: string
  value: string | number | boolean | null
  policy: "AUTO" | "DEFAULT" | "REVIEW_REQUIRED"
}
```

## Smart mapping

AI/semantic category mapping is optional P2. Do not add an LLM API dependency before deterministic/manual mapping works.
