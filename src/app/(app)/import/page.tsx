import type { Metadata } from "next"

import { PageHeader } from "@/components/page-header"

import { ImportProductForm } from "./import-form"

export const metadata: Metadata = {
  title: "Import Product | CatalogBridge",
}

export default function ImportProductPage() {
  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageHeader
        description="Import one public JakMall product into the review queue."
        eyebrow="Catalog intake"
        title="Import Product"
      />

      <div className="mt-6 max-w-4xl">
        <ImportProductForm />
      </div>
    </div>
  )
}
