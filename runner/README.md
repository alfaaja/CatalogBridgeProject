# CatalogBridge local Shopee runner

This independent Node.js package polls owned `shopee_upload_jobs`, opens a
persistent local Chromium profile, and is the only component allowed to interact
with Shopee Seller Centre. Playwright and browser binaries are not part of the
Vercel web build.

## Install and run

```powershell
cd runner
npm install
npx playwright install chromium
$env:CATALOGBRIDGE_SUPABASE_URL="https://your-project.supabase.co"
$env:CATALOGBRIDGE_SUPABASE_PUBLISHABLE_KEY="your-public-key"
npm run start
```

The terminal prompts for the CatalogBridge email and a masked password. The
password is not written or logged; the Supabase session is memory-only. The
runner uses the publishable key as the authenticated user and relies on RLS—no
service-role key is supported.

## Safety behavior

- `AUTOMATION_DRY_RUN=true` is the default.
- A real archive save requires the explicit local setting
  `AUTOMATION_DRY_RUN=false`.
- The only permitted save locator is the exact button name `Simpan & Arsipkan`.
- `Simpan & Tampilkan`, Publish, and Display are never targeted.
- Login, CAPTCHA, 2FA, and device verification stay manual in the visible local
  browser.
- Shopee cookies remain only in `~/.catalogbridge/shopee-profile`.
- Images must use exact trusted HTTPS JakMall hosts, resolve publicly, pass
  content-type/signature/size checks, and are deleted from OS temp storage.
- Missing controls, categories, attributes, shipping, or deterministic variant
  row mapping stop the job safely.

## Current selector-evidence gate

The exact Add Product heading and the exact Save & Archive/final archived labels
have real evidence. The authenticated controls for photos, title, category,
GTIN, attributes, description, price, stock, SKU, weight, dimensions,
declarations, shipping, and variation rows do not yet have captured selector
evidence. The runner therefore opens the real form and stops with
`SELLER_FORM_NOT_VERIFIED` before interaction. Do not replace this guard with
guessed CSS selectors.

After a reviewer opens an authenticated Add Product form, capture only control
roles/labels and update the centralized Seller Centre adapter with focused
tests. Do not save authenticated HTML, screenshots with private seller data,
cookies, or tokens in the repository.

## Checks

```powershell
npm run test
npm run typecheck
npm run build
```
