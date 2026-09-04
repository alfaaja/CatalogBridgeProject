# Acceptance Criteria

## P0 global definition of done

### Import

Given a valid public JakMall product URL, when the user imports it, the system attempts extraction without requiring source-code changes.

### Extraction

For a supported test product, the system obtains and displays at minimum the key available fields among title, description, price, images, variants/SKU/stock, and relevant attributes.

### Persistence

Imported product state survives normal page reload/revisit through the hosted database.

### Normalization

Source values are converted to stable typed values and missing/uncertain information is represented honestly.

### Review

A business user can see what was imported, what selling data will be used, and which fields require confirmation.

### Shopee preparation

The system can create a structured Shopee-ready draft or stronger verified integration result from normalized data without requiring the user to retype all source information.

### Multiple products

At least two different supported products can be processed without changing source code.

### Errors

Invalid URL and at least one source/parse failure produce clear user feedback and technical diagnostic status.

### Images

Product images are displayed or handled with a clear recoverable failure state.

### Hosted demo

The application is accessible through a public URL and the demonstrated workflow works there, not only on localhost.

### Engineering quality

- lint/build pass;
- secrets are not committed;
- modules have understandable responsibilities;
- architecture and limitations can be explained by the candidate.
