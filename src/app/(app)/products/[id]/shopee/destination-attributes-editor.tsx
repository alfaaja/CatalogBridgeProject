"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ShopeeCategoryAttribute } from "@/lib/shopee-draft"

export function DestinationAttributesEditor({
  attributes,
}: {
  attributes: readonly ShopeeCategoryAttribute[]
}) {
  const [rows, setRows] = useState(() =>
    attributes.map((attribute) => ({ ...attribute }))
  )
  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div
          className="grid gap-2 sm:grid-cols-[1fr_1.5fr_auto]"
          key={index}
        >
          <Input
            aria-label={`Attribute ${index + 1} name`}
            maxLength={100}
            name="attributeName"
            onChange={(event) => {
              const value = event.target.value
              setRows((current) =>
                current.map((currentRow, rowIndex) =>
                  rowIndex === index ? { ...currentRow, name: value } : currentRow
                )
              )
            }}
            placeholder="Attribute name"
            value={row.name}
          />
          <Input
            aria-label={`Attribute ${index + 1} value`}
            maxLength={500}
            name="attributeValue"
            onChange={(event) => {
              const value = event.target.value
              setRows((current) =>
                current.map((currentRow, rowIndex) =>
                  rowIndex === index
                    ? { ...currentRow, value }
                    : currentRow
                )
              )
            }}
            placeholder="Destination value"
            value={row.value}
          />
          <Button
            aria-label={`Remove attribute ${index + 1}`}
            onClick={() =>
              setRows((current) =>
                current.filter((_, rowIndex) => rowIndex !== index)
              )
            }
            type="button"
            variant="outline"
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      ))}
      <Button
        disabled={rows.length >= 50}
        onClick={() =>
          setRows((current) => [...current, { name: "", value: "" }])
        }
        type="button"
        variant="outline"
      >
        <Plus aria-hidden="true" />
        Add attribute
      </Button>
    </div>
  )
}
