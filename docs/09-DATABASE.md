# Database

## Database choice

Supabase Postgres.

The PoC needs persistent hosted state, simple inspection, low operational overhead, and deployment compatibility.

## Initial tables

Do not create all tables before the milestone needs them. Recommended end-state:

### `products`

Core normalized product and import status.

Important fields:

- id UUID primary key;
- source platform;
- canonical source URL (unique where appropriate);
- source product id;
- title/description;
- source price/selling price;
- SKU/GTIN;
- stock;
- source category;
- Shopee category mapping fields;
- brand;
- weight/dimensions;
- flexible attributes JSONB;
- raw data JSONB;
- normalized snapshot JSONB only if it provides clear debugging value;
- status/error fields;
- timestamps.

### `product_images`

- product id FK;
- source URL;
- storage path/public URL if copied;
- position;
- primary flag;
- image kind.

### `product_variants`

- product id FK;
- option values JSONB;
- source/selling price;
- stock;
- SKU;
- optional image;
- source data JSONB if needed.

### `process_logs`

- product id FK;
- stage;
- status;
- business-safe message;
- structured details JSONB;
- timestamp.

### `shopee_listings`

- product id FK;
- mapped draft data JSONB;
- integration/export status;
- optional verified Shopee item id;
- export metadata;
- error metadata;
- timestamps.

## Database rules

- migrations must be reproducible and versioned;
- never rely on manual dashboard-only schema edits without documenting SQL/migrations;
- use foreign keys and cascade behavior deliberately;
- use check constraints for finite statuses where practical;
- index only query paths actually used by the PoC;
- do not duplicate every normalized property inside JSONB if a dedicated column is needed for filtering/sorting;
- use JSONB for dynamic source/Shopee attributes, not as an excuse to avoid schema design.

## RLS

Before public deployment, tables exposed through Supabase Data API must have appropriate Row Level Security policies or be accessed exclusively through a safe server-only pattern. The final choice must be documented and tested.

For a single-reviewer PoC, keep policy design simple. Do not build enterprise RBAC unless required.
