# Shopee Integration

## Observed Seller Centre structure

The inspected “Tambah Produk Baru” flow includes:

- product photos (up to the observed gallery limit) and promotional photo;
- optional video;
- name;
- category;
- brand and category-dependent attributes;
- description;
- variation dimensions/options;
- per-combination price, stock, and variation code;
- purchase limits/wholesale settings;
- weight and package dimensions;
- dangerous-product declaration;
- shipping service availability;
- pre-order/insurance;
- condition, display schedule, and parent SKU;
- archive/display actions.

Treat these as observed evidence, not a permanent universal API schema.

## Mapping policy

Each destination field has one status:

- `AUTO` — safe direct mapping;
- `DEFAULT` — documented business default;
- `REVIEW_REQUIRED` — user must confirm/select;
- `UNSUPPORTED` — current PoC does not handle it.

Never silently coerce a risky field just to reach “Ready.”

## Typical mapping

| Normalized source | Shopee concept | Default policy |
|---|---|---|
| title | Product name | AUTO |
| description | Description | AUTO after safe formatting |
| images | Product photos | AUTO if valid |
| promotional image | Promotional photo | REVIEW/DEFAULT |
| selling price | Price | AUTO after user-approved pricing rule |
| stock | Stock | AUTO when known |
| SKU | Parent/variation SKU | AUTO where semantics match |
| variant axes | Variations | AUTO/REVIEW |
| weight grams | Weight | AUTO when known |
| dimensions | Package size | AUTO when known |
| source category | Shopee category | REVIEW_REQUIRED unless mapping verified |
| attributes | Category attributes | AUTO only for verified mapping |
| hazardous material | Dangerous product | REVIEW_REQUIRED unless explicit source data exists |
| condition | Condition | DEFAULT only with explicit business rule |

## Integration adapter

Keep interface flexible, for example:

```ts
interface ShopeeListingAdapter {
  prepare(product: NormalizedProduct): Promise<ShopeeDraft>
  validate(draft: ShopeeDraft): Promise<ValidationResult>
  export?(draft: ShopeeDraft): Promise<ExportArtifact>
  submit?(draft: ShopeeDraft): Promise<SubmissionResult>
}
```

Do not imply `submit` exists if the current integration only prepares/exports.

## Integration strategy order

1. verified prepared draft/preview;
2. verified mass-upload/template path if available to the account;
3. official API if legitimate developer access is available;
4. browser automation only when necessary, with manual login/OTP/CAPTCHA handling and explicit maintenance risk.

## Truthful proof

UI labels must distinguish:

- **Ready for Shopee**;
- **Exported / Prepared**;
- **Uploaded / Submitted**;
- **Published / Verified**.

Never label a prepared draft as published.
