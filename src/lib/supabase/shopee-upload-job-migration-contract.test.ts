import fs from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

const migrationsDirectory = path.join(process.cwd(), "supabase", "migrations")

describe("Shopee upload job migration contract", () => {
  it("creates one owned, constrained upload-job table without publish state", () => {
    const files = fs
      .readdirSync(migrationsDirectory)
      .filter((file) => file.endsWith("_create_shopee_upload_jobs.sql"))

    expect(files).toHaveLength(1)
    const sql = fs.readFileSync(path.join(migrationsDirectory, files[0]), "utf8")

    expect(sql).toContain("create table public.shopee_upload_jobs")
    expect(sql).toContain("references public.products(id) on delete cascade")
    expect(sql).toContain("references auth.users(id) on delete cascade")
    expect(sql).toContain("alter table public.shopee_upload_jobs enable row level security")
    expect(sql).toContain("products.status = 'READY'")
    expect(sql).toContain("products.owner_id = (select auth.uid())")
    expect(sql).toContain("where status <> 'FAILED'")
    expect(sql).not.toContain("'PUBLISHED'")
  })

  it("exposes no anon/delete access and keeps owner and snapshot fields immutable", () => {
    const file = fs
      .readdirSync(migrationsDirectory)
      .find((name) => name.endsWith("_create_shopee_upload_jobs.sql"))!
    const sql = fs.readFileSync(path.join(migrationsDirectory, file), "utf8")

    expect(sql).toMatch(
      /revoke all on table public\.shopee_upload_jobs\s+from public, anon, authenticated, service_role/iu
    )
    expect(sql).not.toMatch(/grant[^;]+to anon/iu)
    expect(sql).not.toMatch(/grant delete/iu)
    expect(sql).not.toMatch(/grant insert \([^;]*owner_id/iu)
    expect(sql).not.toMatch(/grant update \([^;]*(owner_id|manifest|product_id)/iu)
    expect(sql).toContain("invalid upload job status transition")
  })
})
