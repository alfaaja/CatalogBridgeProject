import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { describe, expect, it } from "vitest"

const migrationSource = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260904165616_create_catalog_persistence.sql"
  ),
  "utf8"
)
const migration = migrationSource.toLowerCase()
const compactMigration = migration.replace(/\s+/gu, " ")

describe("Milestone 1 migration contract", () => {
  it("creates only the approved persistence tables and fields", () => {
    for (const table of [
      "products",
      "product_images",
      "product_variants",
      "process_logs",
    ]) {
      expect(migration).toContain(`create table public.${table}`)
    }

    expect(migrationSource).toContain("default 'jakmall'")
    expect(migrationSource).not.toContain("'JAKMALL'")
    expect(compactMigration).not.toContain("title text not null")
    expect(migration).not.toContain("shopee_listings")
    expect(migration).not.toMatch(/\bcondition\b/u)
    expect(migration).not.toContain("hazardous_material")
    expect(migration).not.toContain("preorder")
    expect(migration).not.toContain("storage.")
  })

  it("combines explicit grants with RLS and no anon access", () => {
    expect(migration.match(/enable row level security/g)).toHaveLength(4)
    expect(compactMigration).toContain(
      "from public, anon, authenticated, service_role;"
    )
    expect(compactMigration).toContain(
      "revoke create on schema public from public, anon, authenticated, service_role;"
    )
    expect(compactMigration).toContain(
      "grant insert ( source_platform, canonical_source_url, source_product_identifier, title, status ) on public.products to authenticated;"
    )
    expect(compactMigration).not.toMatch(
      /grant insert \([^;]*owner_id[^;]*\) on public\.products/u
    )
    expect(compactMigration).toContain(
      "grant select on table public.process_logs to authenticated;"
    )
    expect(compactMigration).toContain(
      "grant insert ( product_id, stage, status, message, details ) on public.process_logs to authenticated;"
    )
    expect(compactMigration).not.toMatch(/grant[^;]+to anon/u)
    expect(compactMigration).not.toMatch(
      /grant[^;]*(update|delete)[^;]*public\.process_logs/u
    )
    expect(compactMigration).not.toMatch(
      /grant update \([^;]*\) on public\.(product_images|product_variants)/u
    )
  })

  it("keeps process-log reads scoped through the authenticated owned product", () => {
    expect(compactMigration).toContain(
      "create policy process_logs_select_owned on public.process_logs for select to authenticated using ( exists ( select 1 from public.products where products.id = process_logs.product_id and products.owner_id = (select auth.uid()) ) );"
    )
    expect(compactMigration).not.toContain(
      "create policy process_logs_select_owned on public.process_logs for select to anon"
    )
  })
})
