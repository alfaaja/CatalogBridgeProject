import { describe, expect, it } from "vitest"

import type { ProductSummary } from "./supabase/product-repository"
import {
  buildDashboardSummary,
  getProductStatusPresentation,
} from "./product-presentation"

const product = (
  status: ProductSummary["status"],
  id: string
): ProductSummary => ({
  id,
  sellingPrice: null,
  sourcePrice: null,
  status,
  title: null,
  updatedAt: "2026-09-05T08:00:00+07:00",
})

describe("product presentation", () => {
  it("aggregates only persisted product statuses into dashboard metrics", () => {
    const summary = buildDashboardSummary([
      product("PENDING", "00000000-0000-4000-8000-000000000001"),
      product("IMPORTING", "00000000-0000-4000-8000-000000000002"),
      product("REVIEW_REQUIRED", "00000000-0000-4000-8000-000000000003"),
      product("READY", "00000000-0000-4000-8000-000000000004"),
      product("FAILED", "00000000-0000-4000-8000-000000000005"),
    ])

    expect(summary).toEqual({
      totalProducts: 5,
      readyForShopee: 1,
      needsReview: 1,
      failed: 1,
    })
  })

  it("returns legitimate zero metrics for an empty persisted collection", () => {
    expect(buildDashboardSummary([])).toEqual({
      totalProducts: 0,
      readyForShopee: 0,
      needsReview: 0,
      failed: 0,
    })
  })

  it.each([
    ["PENDING", "Pending", "neutral"],
    ["IMPORTING", "Importing", "neutral"],
    ["REVIEW_REQUIRED", "Needs Review", "warning"],
    ["READY", "Ready for Shopee", "success"],
    ["FAILED", "Failed", "danger"],
  ] as const)("maps %s to business-facing status text", (status, label, tone) => {
    expect(getProductStatusPresentation(status)).toEqual({ label, tone })
  })
})
