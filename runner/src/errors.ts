export const runnerErrorCodes = [
  "ARCHIVED_STATE_NOT_VERIFIED",
  "CATEGORY_NOT_FOUND",
  "DRY_RUN_COMPLETE",
  "IMAGE_DOWNLOAD_FAILED",
  "IMAGE_UPLOAD_FAILED",
  "REQUIRED_ATTRIBUTE_MISSING",
  "SAVE_ARCHIVE_BUTTON_NOT_FOUND",
  "SELLER_FORM_NOT_FOUND",
  "SELLER_FORM_NOT_VERIFIED",
  "SELLER_REJECTED_FORM",
  "SHIPPING_CONFIGURATION_REQUIRED",
  "SHOPEE_LOGIN_REQUIRED",
  "STALE_READY_SNAPSHOT",
  "UNEXPECTED_SELLER_UI",
  "VARIANT_ROW_MAPPING_UNCERTAIN",
] as const;

export type RunnerErrorCode = (typeof runnerErrorCodes)[number];

export class RunnerError extends Error {
  constructor(
    readonly code: RunnerErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "RunnerError";
  }
}

export function safeRunnerError(value: unknown) {
  return value instanceof RunnerError
    ? value
    : new RunnerError("UNEXPECTED_SELLER_UI", "The runner stopped safely.");
}
