import { describe, expect, it } from "vitest"

import {
  formatProcessHistoryTimestamp,
  getProcessHistoryStageLabel,
  getProcessHistoryStatusPresentation,
} from "./process-history-presentation"

describe("process history presentation", () => {
  it.each([
    ["import", "Product import"],
    ["source_parse", "Source parsed"],
    ["normalization", "Product prepared"],
    ["persistence", "Product saved"],
    ["review", "Product review"],
    ["shopee_mapping", "Shopee preparation"],
    ["shopee_handoff", "Shopee handoff"],
  ])("maps %s to its business label", (stage, label) => {
    expect(getProcessHistoryStageLabel(stage)).toBe(label)
  })

  it("uses a truthful fallback for an unknown future stage", () => {
    expect(getProcessHistoryStageLabel("future_stage")).toBe("Other activity")
  })

  it.each([
    ["started", "Started", "neutral"],
    ["success", "Success", "success"],
    ["warning", "Warning", "warning"],
    ["failed", "Failed", "danger"],
  ] as const)("maps %s without changing its meaning", (status, label, tone) => {
    expect(getProcessHistoryStatusPresentation(status)).toEqual({ label, tone })
  })

  it("formats timestamps deterministically in Asia/Jakarta", () => {
    expect(formatProcessHistoryTimestamp("2026-09-06T06:30:00+00:00")).toBe(
      "06 Sep 2026, 13:30 WIB"
    )
  })
})
