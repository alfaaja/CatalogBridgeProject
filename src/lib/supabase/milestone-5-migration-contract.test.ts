import fs from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

const migrationsDirectory = path.join(process.cwd(), "supabase", "migrations")

describe("Milestone 5 migration contract", () => {
  it("adds one deliberate owned Shopee draft migration", () => {
    const files = fs
      .readdirSync(migrationsDirectory)
      .filter((file) => file.endsWith("_create_shopee_drafts.sql"))

    expect(files).toHaveLength(1)
    const sql = fs.readFileSync(
      path.join(migrationsDirectory, files[0]),
      "utf8"
    )

    expect(sql).toContain("create table public.shopee_drafts")
    expect(sql).toContain(
      "alter table public.shopee_drafts enable row level security"
    )
    expect(sql).toMatch(
      /revoke all on table\s+public\.shopee_drafts\s+from public, anon, authenticated, service_role/i
    )
    expect(sql).toContain("references public.products(id) on delete cascade")
    expect(sql).toContain("jsonb_array_length(category_attributes) <= 50")
    expect(sql).not.toMatch(/grant delete/i)
    expect(sql).not.toMatch(/to anon/i)
    expect(sql).toContain("products.status = 'REVIEW_REQUIRED'")
    expect(sql).toContain("products.owner_id = (select auth.uid())")
  })
})
