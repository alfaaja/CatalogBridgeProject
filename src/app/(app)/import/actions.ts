"use server";

import { revalidatePath } from "next/cache";

import {
  ASSISTED_HTML_FIELD_NAME,
  readOptionalAssistedHtmlUpload,
} from "@/lib/import/html-upload";
import { publicImportErrorMessage } from "@/lib/import/import-errors";
import { importJakMallProduct } from "@/lib/import/import-product";
import { createClient } from "@/lib/supabase/server";

export type ImportProductActionState = Readonly<{
  error?: string;
  productId?: string;
  recovery?: "browser_verification";
  sourceUrl?: string;
  success?: string;
}>;

function browserVerificationState(sourceUrl: string) {
  return {
    recovery: "browser_verification" as const,
    sourceUrl,
  };
}

async function hasAuthenticatedReviewer() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();

    return Boolean(
      !error && data?.claims?.sub && data.claims.is_anonymous !== true,
    );
  } catch {
    return false;
  }
}

export async function importProductAction(
  previousState: ImportProductActionState,
  formData: FormData,
): Promise<ImportProductActionState> {
  if (!(await hasAuthenticatedReviewer())) {
    return { error: publicImportErrorMessage("AUTH_REQUIRED") };
  }

  const sourceUrls = formData.getAll("jakmallUrl");

  if (sourceUrls.length !== 1 || typeof sourceUrls[0] !== "string") {
    return { error: publicImportErrorMessage("IMPORT_INVALID_URL") };
  }

  const assisted = await readOptionalAssistedHtmlUpload(
    formData.getAll(ASSISTED_HTML_FIELD_NAME),
  );

  if (!assisted.ok) {
    return {
      error: publicImportErrorMessage("SOURCE_INVALID_ASSISTED_HTML"),
      ...(previousState.recovery === "browser_verification"
        ? browserVerificationState(sourceUrls[0])
        : {}),
    };
  }

  if (assisted.file && previousState.recovery !== "browser_verification") {
    return { error: publicImportErrorMessage("SOURCE_INVALID_ASSISTED_HTML") };
  }

  let result;

  try {
    result = assisted.file
      ? await importJakMallProduct({
          acquisitionMode: "assisted_html",
          assistedHtml: assisted.file.html,
          assistedHtmlByteLength: assisted.file.byteLength,
          sourceUrl: sourceUrls[0],
        })
      : await importJakMallProduct({
          acquisitionMode: "live_url",
          sourceUrl: sourceUrls[0],
        });
  } catch {
    return {
      error: publicImportErrorMessage("DATABASE_WRITE_FAILED"),
      ...(assisted.file && previousState.recovery === "browser_verification"
        ? browserVerificationState(sourceUrls[0])
        : {}),
    };
  }

  if (!result.ok) {
    if (
      !assisted.file &&
      result.classification === "AWS_WAF_HUMAN_VERIFICATION"
    ) {
      return browserVerificationState(sourceUrls[0]);
    }

    return {
      error: result.message,
      ...(assisted.file && previousState.recovery === "browser_verification"
        ? browserVerificationState(sourceUrls[0])
        : {}),
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/products");

  return {
    productId: result.productId,
    success: "Product imported and marked for review.",
  };
}
