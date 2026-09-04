# Pricing & Markup

Markup is an optional P1 feature with strong business value.

## Source vs selling price

Always distinguish:

- source price (JakMall);
- selling price (Shopee draft).

Never overwrite source price when applying markup.

## Supported rules

Start simple:

- percentage markup;
- optional fixed amount if time allows.

Example:

```text
source = 100000
markup = 20%
selling = 120000
```

## Rules

- validate non-negative/allowed ranges;
- define rounding explicitly;
- variants can require per-variant price calculation;
- user can review final selling price before Shopee preparation;
- do not call markup “profit” unless fees/costs are included.

A future profitability model would need marketplace fees, vouchers, shipping subsidies, tax, and other costs. That is out of scope.
