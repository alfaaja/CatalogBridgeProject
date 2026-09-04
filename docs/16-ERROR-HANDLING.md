# Error Handling

## Principles

- errors are typed and attributable to a stage;
- business users get clear recovery guidance;
- technical detail is available for debugging;
- failures do not silently change successful data;
- partial data can be retained when safe.

## Suggested error codes

### Input

- `IMPORT_INVALID_URL`
- `IMPORT_DUPLICATE_PRODUCT`

### Network/source

- `SOURCE_TIMEOUT`
- `SOURCE_UNREACHABLE`
- `SOURCE_REDIRECT_BLOCKED`
- `SOURCE_PRODUCT_NOT_FOUND`

### Parsing/normalization

- `SOURCE_PARSE_FAILED`
- `PRODUCT_TITLE_MISSING`
- `PRODUCT_PRICE_INVALID`
- `VARIANT_MATRIX_INVALID`
- `NORMALIZATION_FAILED`

### Images

- `IMAGE_URL_INVALID`
- `IMAGE_FETCH_FAILED`
- `IMAGE_STORAGE_FAILED`

### Shopee

- `SHOPEE_CATEGORY_REQUIRED`
- `SHOPEE_ATTRIBUTE_REQUIRED`
- `SHOPEE_DRAFT_INVALID`
- `SHOPEE_EXPORT_FAILED`
- `SHOPEE_SUBMISSION_FAILED`

### Auth/database

- `AUTH_REQUIRED`
- `DATABASE_READ_FAILED`
- `DATABASE_WRITE_FAILED`

## UI copy examples

Technical: `SOURCE_PARSE_FAILED`

User: **“Produk belum bisa dibaca dengan lengkap.”**

Support text: “Coba ulangi. Jika tetap gagal, halaman produk mungkin memiliki format yang berbeda.”

Do not expose stack traces to the business UI.
