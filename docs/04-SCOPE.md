# Scope

## P0 — must work

- public hosted web application;
- Supabase connection and safe environment configuration;
- import a valid public JakMall product URL;
- extract core product data;
- normalize to a stable domain model;
- store product/import state;
- product list and product detail/review;
- image preview;
- Shopee mapping/review surface;
- prepare a verifiable Shopee-ready result;
- multiple products without source-code edits;
- clear error and review states;
- lint/build clean;
- demoable flow.

## P1 — implement after P0 is proven

- percentage/fixed markup;
- duplicate detection;
- import/process history;
- batch URL input;
- retry failed import;
- Supabase Storage copy of source images when justified;
- better category/attribute mapping;
- focused unit/integration tests.

## P2 — only if time remains and evidence supports it

- Shopee mass-upload template generation;
- official Shopee API integration if account/app access is genuinely available;
- browser automation worker if necessary and maintainable;
- scheduler/queue;
- containerization;
- advanced analytics.

## Explicitly out of scope for this PoC

- microservices;
- Kubernetes;
- Kafka/event streaming;
- custom authentication infrastructure;
- payment/order fulfillment system;
- full ERP/PIM;
- native mobile app;
- multi-tenant enterprise RBAC;
- arbitrary website scraping;
- CAPTCHA/OTP/2FA bypass;
- hidden/unofficial authenticated API exploitation.

## Scope discipline

Do not implement P1/P2 features while a P0 acceptance criterion is failing, unless the P1/P2 item is required to unblock P0.
