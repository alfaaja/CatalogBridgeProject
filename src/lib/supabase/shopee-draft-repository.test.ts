import { beforeEach, describe, expect, it, vi } from "vitest"

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }))
vi.mock("./server", () => ({ createClient: createClientMock }))

import {
  getShopeeDraft,
  saveShopeeDraft,
  transitionProductForShopee,
} from "./shopee-draft-repository"

const productId = "11111111-1111-4111-8111-111111111111"
const input = {
  categoryAttributes: [{ name: "Material", value: "Steel" }],
  categoryAttributesReviewed: true,
  categoryConfirmed: true,
  categoryId: null,
  categoryPath: "Home > Tools",
  condition: "NEW" as const,
  dangerousProduct: "NO" as const,
  descriptionOverride: null,
  preorder: "NO" as const,
  titleOverride: null,
}

describe("Shopee draft repository", () => {
  beforeEach(() => createClientMock.mockReset())

  it("loads one owned draft with an explicit select", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        category_attributes: input.categoryAttributes,
        category_attributes_reviewed: true,
        category_confirmed: true,
        category_id: null,
        category_path: "Home > Tools",
        condition: "NEW",
        created_at: "2026-09-05T00:00:00+00:00",
        dangerous_product: "NO",
        description_override: null,
        preorder: "NO",
        product_id: productId,
        title_override: null,
        updated_at: "2026-09-05T00:00:00+00:00",
      },
      error: null,
    })
    const eq = vi.fn(() => ({ maybeSingle }))
    const select = vi.fn(() => ({ eq }))
    createClientMock.mockResolvedValue({ from: vi.fn(() => ({ select })) })

    await expect(getShopeeDraft(productId)).resolves.toMatchObject({
      ok: true,
      draft: { productId, categoryPath: "Home > Tools" },
    })
    expect(select).toHaveBeenCalledWith(
      "product_id,title_override,description_override,category_id,category_path,category_confirmed,category_attributes,category_attributes_reviewed,dangerous_product,condition,preorder,created_at,updated_at"
    )
  })

  it("distinguishes a missing draft from malformed persisted data", async () => {
    const maybeSingle = vi
      .fn()
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: { condition: "INVALID" }, error: null })
    const eq = vi.fn(() => ({ maybeSingle }))
    const select = vi.fn(() => ({ eq }))
    createClientMock.mockResolvedValue({ from: vi.fn(() => ({ select })) })

    await expect(getShopeeDraft(productId)).resolves.toEqual({
      draft: null,
      ok: true,
    })
    await expect(getShopeeDraft(productId)).resolves.toEqual({
      error: "DATABASE_READ_FAILED",
      ok: false,
    })
  })

  it("updates an existing draft without trying to update its product identity", async () => {
    const maybeSingle = vi
      .fn()
      .mockResolvedValue({ data: { product_id: productId }, error: null })
    const select = vi.fn(() => ({ maybeSingle }))
    const eq = vi.fn(() => ({ select }))
    const update = vi.fn(() => ({ eq }))
    const insert = vi.fn()
    createClientMock.mockResolvedValue({
      from: vi.fn(() => ({ insert, update })),
    })

    await expect(saveShopeeDraft(productId, input)).resolves.toEqual({
      ok: true,
    })
    expect(update).toHaveBeenCalledWith(
      expect.not.objectContaining({
        owner_id: expect.anything(),
        product_id: expect.anything(),
        status: expect.anything(),
      })
    )
    expect(insert).not.toHaveBeenCalled()
  })

  it("inserts a draft when no existing row can be updated", async () => {
    const updateMaybeSingle = vi
      .fn()
      .mockResolvedValue({ data: null, error: null })
    const updateSelect = vi.fn(() => ({ maybeSingle: updateMaybeSingle }))
    const eq = vi.fn(() => ({ select: updateSelect }))
    const update = vi.fn(() => ({ eq }))
    const insertSingle = vi
      .fn()
      .mockResolvedValue({ data: { product_id: productId }, error: null })
    const insertSelect = vi.fn(() => ({ single: insertSingle }))
    const insert = vi.fn(() => ({ select: insertSelect }))
    createClientMock.mockResolvedValue({
      from: vi.fn(() => ({ insert, update })),
    })

    await expect(saveShopeeDraft(productId, input)).resolves.toEqual({
      ok: true,
    })
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ product_id: productId })
    )
  })

  it("performs only literal expected-state transitions", async () => {
    const single = vi
      .fn()
      .mockResolvedValue({ data: { id: productId }, error: null })
    const select = vi.fn(() => ({ single }))
    const statusEq = vi.fn(() => ({ select }))
    const idEq = vi.fn(() => ({ eq: statusEq }))
    const update = vi.fn(() => ({ eq: idEq }))
    createClientMock.mockResolvedValue({ from: vi.fn(() => ({ update })) })

    await expect(
      transitionProductForShopee(productId, "REVIEW_REQUIRED", "READY")
    ).resolves.toEqual({ ok: true })
    expect(update).toHaveBeenCalledWith({ status: "READY" })
    expect(statusEq).toHaveBeenCalledWith("status", "REVIEW_REQUIRED")
  })
})
