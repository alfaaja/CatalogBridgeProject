# Code Quality

## Principles

- clarity over cleverness;
- explicit domain names;
- small cohesive modules;
- no speculative generic abstraction;
- no giant “god” scraper/uploader file;
- typed errors and validated boundaries;
- comments explain why, not obvious syntax.

## TypeScript

- avoid `any`; use `unknown` + validation at untrusted boundaries;
- prefer discriminated unions for statuses/results;
- keep DTO/source schemas separate from normalized domain types;
- do not use non-null assertions to hide missing runtime configuration unless startup validation guarantees them.

## React/Next.js

- default to server components where appropriate;
- use client components only for interaction/browser APIs;
- do not fetch the same data independently in many nested components;
- keep business logic out of JSX;
- use accessible shadcn primitives rather than hand-rolled modal/menu behavior.

## File size

No arbitrary hard line limit, but a file that mixes unrelated concerns should be split. Do not split a simple 80-line module into five files merely to look “architected.”

## Refactoring rule

Do not perform unrelated refactors inside a deadline-critical feature change.
