# Source of Truth

## External assessment source

The authoritative business assessment is the Buruh Ketik technical project PDF supplied by the candidate. It describes a PoC for **JakMall Product Scraper & Shopee Listing Automation** and prioritizes end-to-end execution, reliability, engineering judgement, cost efficiency, maintainability, usability, and candidate understanding.

Do not commit the confidential assessment PDF to a public repository.

## Observed Shopee source

The candidate inspected the current Shopee Seller Centre “Tambah Produk Baru” flow. Observed product-entry surfaces include:

- product photos and promotional photo;
- optional product video;
- product name;
- category;
- brand and category-dependent attributes;
- description;
- up to multiple variation dimensions/options;
- per-combination price, stock, and variation code;
- minimum/maximum purchase settings and wholesale controls;
- weight and package dimensions;
- dangerous-product declaration;
- shipping service availability;
- pre-order and shipping insurance;
- condition, display schedule, and parent SKU;
- archive/display actions.

Shopee fields may change over time or by category/account. Do not hard-code the entire observed cable-product form as a universal schema.

## Repository truth

For implementation decisions, the project-specific documents in this bundle are the design baseline. Any externally changing behavior (Next.js/Supabase/Shopee/JakMall) should be verified against current official documentation or actual observed behavior before release.
