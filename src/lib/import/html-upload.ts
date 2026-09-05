export const ASSISTED_HTML_FIELD_NAME = "assistedHtml"
export const ASSISTED_HTML_MAX_BYTES = 1024 * 1024

type AssistedHtmlFile = Readonly<{
  byteLength: number
  html: string
}>

type AssistedHtmlResult =
  | Readonly<{ ok: true; file: AssistedHtmlFile | null }>
  | Readonly<{ ok: false; error: "ASSISTED_HTML_INVALID" }>

function invalid(): AssistedHtmlResult {
  return { ok: false, error: "ASSISTED_HTML_INVALID" }
}

function isFileEntry(value: FormDataEntryValue): value is File {
  return (
    typeof value !== "string" &&
    typeof value.arrayBuffer === "function" &&
    typeof value.name === "string" &&
    typeof value.size === "number"
  )
}

function containsBinaryControls(bytes: Uint8Array) {
  if (bytes.includes(0)) {
    return true
  }

  let controlCount = 0

  for (const byte of bytes) {
    if (byte < 32 && byte !== 9 && byte !== 10 && byte !== 13) {
      controlCount += 1
    }
  }

  return controlCount > Math.max(1, Math.floor(bytes.length * 0.01))
}

function looksLikeHtml(value: string) {
  return /<(?:!doctype\s+html|html|head|body|link|meta|script)\b/iu.test(value)
}

export async function readOptionalAssistedHtmlUpload(
  entries: readonly FormDataEntryValue[]
): Promise<AssistedHtmlResult> {
  if (entries.length === 0) {
    return { ok: true, file: null }
  }

  if (entries.length !== 1 || !isFileEntry(entries[0])) {
    return invalid()
  }

  const file = entries[0]

  if (file.name === "" && file.size === 0) {
    return { ok: true, file: null }
  }

  if (
    !/\.html?$/iu.test(file.name.trim()) ||
    file.size === 0 ||
    file.size > ASSISTED_HTML_MAX_BYTES
  ) {
    return invalid()
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer())

    if (
      bytes.byteLength === 0 ||
      bytes.byteLength > ASSISTED_HTML_MAX_BYTES ||
      containsBinaryControls(bytes)
    ) {
      return invalid()
    }

    const html = new TextDecoder("utf-8", { fatal: true }).decode(bytes)

    return html.trim() && looksLikeHtml(html)
      ? { ok: true, file: { byteLength: bytes.byteLength, html } }
      : invalid()
  } catch {
    return invalid()
  }
}
