# Product Image Handling

## Source

Keep original source image URL and ordering.

## Default PoC approach

First determine whether direct source image URLs are stable and compatible with the product review/export path.

If stable hosted copies are required:

1. validate source URL/host;
2. fetch server-side with size/type limits;
3. validate content type;
4. store in Supabase Storage under predictable unique paths;
5. save storage path/public/signed URL strategy;
6. keep source URL for traceability.

## Security

- never proxy arbitrary user-supplied URLs;
- prevent SSRF through image fetches;
- enforce maximum response size;
- allow expected image MIME types;
- do not execute SVG/script content as trusted HTML.

## UX

- maintain aspect ratio;
- clear primary image;
- broken image has placeholder + retry/message;
- no huge gallery layout that pushes product data below the fold unnecessarily.

## Shopee

The integration adapter decides whether it needs source URLs, hosted URLs, or local/exported files. Image storage strategy should follow the verified integration, not precede it.
