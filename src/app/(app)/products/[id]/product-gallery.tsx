"use client"

import { useState } from "react"
import { ImageOff } from "lucide-react"
import Image from "next/image"

import type { ProductReviewImage } from "@/lib/product-review"

function ImageFallback({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted/40 px-3 text-center text-muted-foreground">
      <ImageOff aria-hidden="true" className={compact ? "size-4" : "size-7"} />
      {compact ? null : <span className="text-xs">Image unavailable</span>}
    </span>
  )
}

export function ProductGallery({
  images,
  title,
}: {
  images: readonly ProductReviewImage[]
  title: string | null
}) {
  const [failedImageIds, setFailedImageIds] = useState<ReadonlySet<string>>(
    new Set()
  )
  const orderedImages = [...images].sort(
    (left, right) =>
      Number(right.isPrimary) - Number(left.isPrimary) ||
      left.position - right.position
  )
  const primaryImage = orderedImages[0]

  function markFailed(imageId: string) {
    setFailedImageIds((current) => new Set([...current, imageId]))
  }

  if (!primaryImage) {
    return (
      <div className="aspect-square overflow-hidden rounded-lg border">
        <ImageFallback />
      </div>
    )
  }

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted/20">
        {failedImageIds.has(primaryImage.id) ? (
          <ImageFallback />
        ) : (
          <Image
            alt={`${title ?? "Untitled JakMall product"} — primary product photo`}
            className="object-contain p-4"
            fill
            loading="eager"
            onError={() => markFailed(primaryImage.id)}
            sizes="(min-width: 1280px) 32vw, (min-width: 768px) 42vw, 100vw"
            src={primaryImage.sourceUrl}
          />
        )}
      </div>

      {orderedImages.length > 1 ? (
        <ul
          aria-label="Additional product images"
          className="mt-3 grid grid-cols-4 gap-2"
        >
          {orderedImages.slice(1, 5).map((image, index) => (
            <li
              className="relative aspect-square overflow-hidden rounded-md border bg-muted/20"
              key={image.id}
            >
              {failedImageIds.has(image.id) ? (
                <ImageFallback compact />
              ) : (
                <Image
                  alt={`${title ?? "Untitled JakMall product"} — product photo ${index + 2}`}
                  className="object-contain p-1"
                  fill
                  onError={() => markFailed(image.id)}
                  sizes="(min-width: 1280px) 8vw, 20vw"
                  src={image.sourceUrl}
                />
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
