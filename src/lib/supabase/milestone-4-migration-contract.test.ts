import { readFileSync, readdirSync } from "node:fs"
import { resolve } from "node:path"

import { describe, expect, it } from "vitest"

const migrationDirectory = resolve(process.cwd(), "supabase/migrations")
const migrationFiles = readdirSync(migrationDirectory).filter((file) =>
  file.endsWith("_allow_owned_variant_review_updates.sql")
)
const migration = migrationFiles[0]
  ? readFileSync(resolve(migrationDirectory, migrationFiles[0]), "utf8")
      .toLowerCase()
      .replace(/\s+/gu, " ")
  : ""

describe("Milestone 4 migration contract", () => {
  it("adds one deliberate variant review migration", () => {
    expect(migrationFiles).toHaveLength(1)
  })

  it("limits authenticated variant updates to review-owned fields", () => {
    expect(migration).toContain(
      "revoke update on table public.product_variants from public, anon, authenticated, service_role;"
    )
    expect(migration).toContain(
      "grant update ( selling_price, stock, sku ) on table public.product_variants to authenticated;"
    )
    expect(migration).not.toMatch(/grant update[^;]+source_price/u)
    expect(migration).not.toMatch(/grant delete[^;]+product_variants/u)
    expect(migration).not.toMatch(/grant[^;]+product_variants to (?:anon|service_role)/u)
  })

  it("uses both ownership checks on the update policy", () => {
    expect(migration).toContain("create policy product_variants_update_owned")
    expect(migration).toContain("for update to authenticated")
    expect(migration).toContain("using (")
    expect(migration).toContain("with check (")
    expect(migration).toContain("products.owner_id = (select auth.uid())")
    expect(migration.match(/products\.status = 'review_required'/gu)).toHaveLength(2)
  })
})
