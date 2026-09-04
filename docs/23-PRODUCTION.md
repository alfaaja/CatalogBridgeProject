# Production Demo Readiness

This project is a PoC, not a claim of production-grade scale. “Production” here means the **public assessment/demo deployment** is safe and reliable enough to review.

## Must pass before sharing the URL

### Build

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] relevant automated tests pass
- [ ] browser console has no unexplained critical errors

### Security

- [ ] no secrets in Git history/current tracked files
- [ ] `.env.local` ignored
- [ ] Vercel environment variables configured correctly
- [ ] Supabase RLS/server boundaries reviewed
- [ ] scraper URL allowlist/SSRF safeguards tested
- [ ] no CAPTCHA/OTP/2FA bypass logic

### Data

- [ ] database schema/migrations applied
- [ ] demo data is identifiable as demo/test data where needed
- [ ] no private screenshots/identity data exposed
- [ ] duplicate behavior tested

### User flow

- [ ] login works if enabled
- [ ] dashboard loads
- [ ] valid JakMall import works
- [ ] invalid URL shows friendly error
- [ ] product review works
- [ ] image gallery works or fails gracefully
- [ ] price/stock/variants render correctly for test fixtures
- [ ] Shopee readiness explains unresolved fields
- [ ] final prepare/export/submission state is truthful
- [ ] retry/recovery path works for at least one known failure

### UX

- [ ] no lorem ipsum
- [ ] no fake analytics
- [ ] no dead navigation item
- [ ] no non-functional primary button
- [ ] no obvious AI-slop patterns from design spec
- [ ] desktop review is polished
- [ ] mobile/tablet does not break critically

### Documentation/demo

- [ ] README has install/run steps
- [ ] architecture can be explained in <2 minutes
- [ ] known limitations are documented
- [ ] cost estimate is documented
- [ ] AI-assisted portions are disclosed honestly
- [ ] demo script has been rehearsed

## Known acceptable PoC limitations

It is acceptable for category mapping or Shopee authentication-dependent steps to require manual confirmation if that limitation is clearly shown and the system still demonstrates the verified pipeline.
