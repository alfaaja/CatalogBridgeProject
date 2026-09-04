# JakMall Scraper

## Goal

Reliably extract public product information from valid JakMall product pages without using credentials or bypassing access controls.

## Input contract

Only accept expected JakMall HTTPS product URLs. Canonicalize before duplicate checks.

Server-side validation must reject:

- `http://` if HTTPS is available/required;
- localhost;
- loopback/private/link-local IPs;
- non-JakMall hostnames;
- `file:`, `ftp:`, `data:`, and other schemes;
- redirects to disallowed hosts.

## Extraction priority

1. structured data such as JSON-LD when present and trustworthy;
2. embedded application JSON/data attributes;
3. stable semantic DOM labels/attributes;
4. narrow fallback selectors;
5. browser rendering only when evidence proves normal fetch cannot obtain required public data.

## Desired fields

- title;
- description;
- price;
- image gallery;
- SKU/product code;
- stock/availability;
- variant axes/options/combinations;
- weight/dimensions;
- category;
- product attributes.

## Robustness principles

- isolate selectors/parsers by concept;
- prefer semantic selectors over positional CSS chains;
- validate extracted values before accepting them;
- missing optional fields return null/empty, not exceptions;
- required-field failure returns a typed error;
- keep a limited raw snapshot/structured payload for debugging, avoiding unnecessary personal/session data;
- include fixture-based parser tests for representative pages.

## Request behavior

- use a reasonable timeout;
- do not hammer the site;
- no aggressive parallelism for the PoC;
- honor normal public access behavior;
- retry only transient failures with bounded attempts/backoff;
- log stage/duration without secrets.

## Browser fallback decision gate

Do not install or add Playwright just because it might be useful.

Add it only if all are true:

1. real product pages fail to expose required data through normal fetch;
2. the missing data materially blocks the P0 flow;
3. browser rendering is technically/legal-operationally acceptable for the demo;
4. the deployment strategy can support it;
5. the extra maintenance cost is documented.
