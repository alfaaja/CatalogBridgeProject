# Domain Model

Use explicit TypeScript types plus Zod schemas at trust boundaries.

## SourceProduct

Represents data extracted from JakMall before final normalization.

Suggested fields:

```ts
type SourceProduct = {
  source: "jakmall"
  sourceUrl: string
  sourceProductId?: string | null
  title?: string | null
  description?: string | null
  price?: unknown
  images?: string[]
  sku?: string | null
  gtin?: string | null
  stock?: unknown
  weight?: unknown
  dimensions?: unknown
  category?: string | null
  attributes?: Record<string, unknown>
  variantGroups?: unknown[]
  raw: unknown
}
```

## NormalizedProduct

```ts
type NormalizedProduct = {
  id: string
  source: "jakmall"
  sourceUrl: string
  sourceProductId?: string | null

  title: string
  description: string | null

  sourcePrice: number | null
  sellingPrice: number | null
  currency: "IDR"

  sku: string | null
  gtin: string | null
  stock: number | null

  category: {
    sourceName?: string | null
    shopeeCategoryId?: string | null
    shopeeCategoryName?: string | null
  }

  brand: string | null
  attributes: Record<string, unknown>
  images: ProductImage[]
  variantAxes: VariantAxis[]
  variants: ProductVariant[]

  weightGrams: number | null
  dimensionsCm: {
    length: number | null
    width: number | null
    height: number | null
  }

  hazardousMaterial: boolean | null
  condition: "new" | "used" | "unknown"
  preorder: boolean | null

  status: ProductStatus
  completeness: FieldIssue[]
}
```

## ProductImage

```ts
type ProductImage = {
  sourceUrl: string
  storagePath?: string | null
  publicUrl?: string | null
  position: number
  isPrimary: boolean
  kind: "product" | "promotional"
}
```

## Variants

Shopee can model multiple variation dimensions. Do not assume only color/size.

```ts
type VariantAxis = {
  name: string
  options: string[]
}

type ProductVariant = {
  id?: string
  optionValues: Record<string, string>
  sourcePrice: number | null
  sellingPrice: number | null
  stock: number | null
  sku: string | null
  imageUrl?: string | null
}
```

## FieldIssue

```ts
type FieldIssue = {
  field: string
  severity: "required" | "warning"
  code: string
  message: string
}
```

Do not store Shopee category-specific fields as fixed domain columns unless they are universally meaningful. Category attributes belong in flexible structured data plus validated mapper rules.
