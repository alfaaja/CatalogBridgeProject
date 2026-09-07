import type { SupabaseClient } from "@supabase/supabase-js";
import type { BrowserContext } from "playwright";

import { safeRunnerError } from "./errors.js";
import {
  appendAutomationEvent,
  assertFreshReadySnapshot,
  transitionJob,
  type RunnerJob,
} from "./jobs.js";
import {
  fillVerifiedSellerCentreListing,
  hasVerifiedProductForm,
  openSellerCentre,
  saveArchived,
  waitForManualShopeeAuthentication,
} from "./seller-centre.js";

export async function processShopeeJob(
  client: SupabaseClient,
  context: BrowserContext,
  claimed: RunnerJob,
  dryRun: boolean,
) {
  let current = claimed;
  try {
    await assertFreshReadySnapshot(client, current.manifest);
    await appendAutomationEvent(client, current, {
      event: "SHOPEE_AUTOMATION_STARTED",
      message: "Local Shopee runner connected.",
      status: "started",
    });

    const page = await openSellerCentre(context);
    if (!(await hasVerifiedProductForm(page))) {
      current = await transitionJob(client, current, "AUTH_REQUIRED", {
        code: "SHOPEE_LOGIN_REQUIRED",
        message: "Complete Shopee login, CAPTCHA, or 2FA in the local browser.",
      });
      await appendAutomationEvent(client, current, {
        event: "SHOPEE_AUTH_REQUIRED",
        message: "Shopee authentication required in the local browser.",
        status: "warning",
      });
      process.stdout.write(
        "Complete Shopee login/CAPTCHA/2FA in the opened browser. The runner will resume after the exact product form is visible.\n",
      );
      await waitForManualShopeeAuthentication(page);
    }

    await assertFreshReadySnapshot(client, current.manifest);
    current = await transitionJob(client, current, "RUNNING", {
      message: dryRun
        ? "Dry-run is active; Save & Archive will not be clicked."
        : "Filling the verified Seller Centre form.",
    });
    await fillVerifiedSellerCentreListing(page, current.manifest);
    await assertFreshReadySnapshot(client, current.manifest);
    await saveArchived(page, dryRun);

    if (dryRun) {
      current = await transitionJob(client, current, "NEEDS_USER_ACTION", {
        code: "DRY_RUN_COMPLETE",
        message: "Dry-run completed without saving.",
      });
      await appendAutomationEvent(client, current, {
        event: "SHOPEE_AUTOMATION_NEEDS_ACTION",
        message: "Shopee dry-run completed without saving.",
        status: "warning",
      });
      return;
    }

    current = await transitionJob(client, current, "SAVED_ARCHIVED", {
      message:
        "Seller Centre retained the listing as archived and non-published.",
    });
    await appendAutomationEvent(client, current, {
      event: "SHOPEE_AUTOMATION_SAVED_ARCHIVED",
      message: "Saved to Seller Centre as archived.",
      status: "success",
    });
  } catch (value) {
    const error = safeRunnerError(value);
    if (current.status === "SAVED_ARCHIVED" || current.status === "FAILED") {
      process.stderr.write("Terminal job evidence could not be appended.\n");
      return;
    }
    const next =
      error.code === "STALE_READY_SNAPSHOT" ? "FAILED" : "NEEDS_USER_ACTION";
    current = await transitionJob(client, current, next, {
      code: error.code,
      message: error.message,
    });
    await appendAutomationEvent(client, current, {
      event:
        next === "FAILED"
          ? "SHOPEE_AUTOMATION_FAILED"
          : "SHOPEE_AUTOMATION_NEEDS_ACTION",
      message:
        next === "FAILED"
          ? "Shopee automation failed safely."
          : "Shopee automation needs reviewer action.",
      status: next === "FAILED" ? "failed" : "warning",
    });
  }
}
