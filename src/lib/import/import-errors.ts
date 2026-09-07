export type ImportProductErrorCode =
  | "AUTH_REQUIRED"
  | "DATABASE_WRITE_FAILED"
  | "IMPORT_DUPLICATE_PRODUCT"
  | "IMPORT_INVALID_URL"
  | "SOURCE_DOCUMENT_MISMATCH"
  | "SOURCE_INVALID_ASSISTED_HTML"
  | "SOURCE_PARSE_FAILED"
  | "SOURCE_PRODUCT_NOT_FOUND"
  | "SOURCE_REDIRECT_BLOCKED"
  | "SOURCE_TIMEOUT"
  | "SOURCE_UNREACHABLE";

const humanVerificationMessage =
  "JakMall requires browser verification before this page can be accessed automatically. Open the product page normally in your browser, save it as HTML, then upload the file below.";

const messages: Readonly<Record<ImportProductErrorCode, string>> = {
  AUTH_REQUIRED: "Please sign in again before importing a product.",
  DATABASE_WRITE_FAILED:
    "The product could not be saved. Please retry after checking the Supabase connection.",
  IMPORT_DUPLICATE_PRODUCT:
    "An import already exists for this JakMall product. Retry for existing imports is not available yet.",
  IMPORT_INVALID_URL: "Enter a valid public JakMall product URL.",
  SOURCE_DOCUMENT_MISMATCH:
    "That file does not look like the selected JakMall product page.",
  SOURCE_INVALID_ASSISTED_HTML:
    "That file does not look like the selected JakMall product page.",
  SOURCE_PARSE_FAILED:
    "CatalogBridge could not read enough product information from that page.",
  SOURCE_PRODUCT_NOT_FOUND: "JakMall could not find that product page.",
  SOURCE_REDIRECT_BLOCKED:
    "CatalogBridge could not safely follow that product page redirect.",
  SOURCE_TIMEOUT: "JakMall took too long to respond. Try again.",
  SOURCE_UNREACHABLE:
    "CatalogBridge could not reach that JakMall product page. Try again.",
};

export function publicImportErrorMessage(
  error: ImportProductErrorCode,
  classification?: "AWS_WAF_HUMAN_VERIFICATION",
) {
  if (
    error === "SOURCE_UNREACHABLE" &&
    classification === "AWS_WAF_HUMAN_VERIFICATION"
  ) {
    return humanVerificationMessage;
  }

  return messages[error];
}
