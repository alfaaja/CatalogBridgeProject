# User Personas

## Primary: Business Operator

Technical level: low to moderate.

Goals:

- move products from JakMall to Shopee faster;
- see exactly what was imported;
- adjust selling price/margin;
- know what information still needs attention;
- avoid retyping product data;
- trust whether the result is ready.

Needs:

- plain language;
- clear next action;
- product images visible;
- obvious status labels;
- edit/review before irreversible action;
- helpful recovery from failure.

Avoid exposing by default:

- HTTP status codes;
- DOM selectors;
- JSON payloads;
- database ids;
- stack traces;
- worker terminology.

## Secondary: Technical Reviewer / Interviewer

Goals:

- understand architecture and trade-offs;
- inspect proof that source data moved through the system;
- see reliability and security considerations;
- verify the candidate understands the code.

Needs:

- optional raw/source data view;
- process history/logs;
- architecture/README;
- known limitations;
- clear AI-assisted-development disclosure.
