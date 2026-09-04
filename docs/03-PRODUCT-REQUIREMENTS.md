# Product Requirements

## Mandatory functional requirements

### Product input

- Accept at least a public JakMall product URL.
- Prefer support for multiple URLs without code changes.
- Validate the hostname and URL before any network request.

### Product extraction

Extract when available:

- title/name;
- description;
- source price;
- main image and gallery;
- variations/options;
- SKU/product code;
- stock/availability;
- weight/dimensions;
- category;
- relevant source attributes.

Missing optional data must not crash the full import.

### Normalization

- Convert source values into a consistent domain model.
- Keep raw source data when useful for debugging/reprocessing.
- Do not pretend missing information exists.
- Flag fields that require user review.

### Shopee preparation/listing flow

- Map normalized product fields to a Shopee-ready draft.
- Minimize repeated manual typing.
- Support fallback/default/manual confirmation when mapping is not safe.
- Provide a verifiable final step: actual supported upload path where feasible, or a clearly labeled prepared/exported state that can be demonstrated honestly.

### Image handling

- Show source images in the product review UI.
- Preserve source URL metadata.
- Store copies only when the chosen flow needs stable hosted images.
- Handle failed/invalid images gracefully.

### Multiple products

- The solution must not be hard-coded to one product page.
- Product imports must have independent statuses and errors.

### Status and errors

The user must see understandable statuses for:

- importing;
- needs review;
- ready;
- prepared/exported;
- uploaded/verified if implemented;
- failed.

Technical detail can exist in an advanced/log view, not as the primary business message.

## Non-functional requirements

- low development and operating cost;
- reasonable reliability against small page changes;
- maintainable structure and separation of concerns;
- no secrets in source control;
- simple workflow for non-developers;
- reasonable performance, not benchmark-chasing;
- clear explanation of scaling changes if volume increases.

## Optional value-add only after mandatory flow works

- batch import;
- retry mechanism;
- duplicate detection;
- automatic markup/margin;
- smarter category/attribute mapping;
- preview/edit before prepare/publish;
- history dashboard;
- easy/cheap deployment;
- automated tests for important logic.
