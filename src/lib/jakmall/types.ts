export type JakMallSourceScalar = string | number

export type JakMallSourceQuantity = Readonly<{
  unit: string | null
  value: JakMallSourceScalar
}>

export type JakMallPageIdentityEvidence = Readonly<{
  canonicalUrl: string | null
  source: "canonical" | "json_ld_product" | "og_url"
  url: string
}>

export type JakMallSourceOffer = Readonly<{
  availability: string | null
  image: string | null
  optionValues: Readonly<Record<string, string>>
  sku: string | null
  sourcePrice: JakMallSourceScalar | null
  sourceVariantIdentifier: string | null
  stock: JakMallSourceScalar | null
}>

export type JakMallSourceProduct = Readonly<{
  attributes: Readonly<Record<string, string>>
  availability: string | null
  brand: string | null
  categoryPath: readonly string[]
  description: string | null
  dimensions: Readonly<{
    height: JakMallSourceQuantity | null
    length: JakMallSourceQuantity | null
    width: JakMallSourceQuantity | null
  }>
  gtin: string | null
  images: readonly string[]
  offers: readonly JakMallSourceOffer[]
  pageIdentity: Readonly<{
    evidence: readonly JakMallPageIdentityEvidence[]
    verified: boolean
  }>
  parserStrategy: "json_ld_product" | "semantic_dom"
  sku: string | null
  sourcePrice: JakMallSourceScalar | null
  sourceProductIdentifier: string | null
  stock: JakMallSourceScalar | null
  title: string | null
  variantAxes: readonly Readonly<{
    name: string
    options: readonly string[]
  }>[]
  warnings: readonly string[]
  weight: JakMallSourceQuantity | null
}>

export type JakMallParseResult =
  | Readonly<{ ok: true; product: JakMallSourceProduct }>
  | Readonly<{
      ok: false
      error: "SOURCE_DOCUMENT_MISMATCH" | "SOURCE_PARSE_FAILED"
    }>
