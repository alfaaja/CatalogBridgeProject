import type { BrowserContext, Page } from "playwright";

import { RunnerError } from "./errors.js";
import type { UploadManifest } from "./manifest.js";
import { buildListingPlan } from "./planner.js";
import { clickSaveAndArchive, sellerCentreText } from "./selectors.js";

export const SELLER_CENTRE_NEW_PRODUCT_URL =
  "https://seller.shopee.co.id/portal/product/new?from=sidebar";

export async function openSellerCentre(context: BrowserContext) {
  const pages = context.pages();
  const page = pages[0] ?? (await context.newPage());
  await page.goto(SELLER_CENTRE_NEW_PRODUCT_URL, {
    waitUntil: "domcontentloaded",
  });
  return page;
}

export async function hasVerifiedProductForm(page: Page) {
  return (
    (await page
      .getByRole("heading", {
        exact: true,
        name: sellerCentreText.createHeading,
      })
      .count()) === 1
  );
}

export async function waitForManualShopeeAuthentication(page: Page) {
  await page
    .getByRole("heading", {
      exact: true,
      name: sellerCentreText.createHeading,
    })
    .waitFor({ state: "visible", timeout: 30 * 60 * 1_000 });
}

export async function fillVerifiedSellerCentreListing(
  _page: Page,
  manifest: UploadManifest,
) {
  buildListingPlan(manifest);

  // The exact field controls have not yet been captured from an authenticated
  // Seller Centre session. Stop before interacting instead of guessing labels,
  // CSS selectors, category controls, variation rows, or upload inputs.
  throw new RunnerError(
    "SELLER_FORM_NOT_VERIFIED",
    "Seller Centre field selectors require one authenticated evidence pass.",
  );
}

export async function saveArchived(page: Page, dryRun: boolean) {
  await clickSaveAndArchive(page, dryRun);
  if (dryRun) return;
  await Promise.all([
    page
      .getByText(sellerCentreText.notDisplayedState, { exact: true })
      .waitFor({
        state: "visible",
        timeout: 30_000,
      }),
    page.getByText(sellerCentreText.archivedState, { exact: true }).waitFor({
      state: "visible",
      timeout: 30_000,
    }),
  ]).catch(() => {
    throw new RunnerError(
      "ARCHIVED_STATE_NOT_VERIFIED",
      "Seller Centre archive state could not be verified.",
    );
  });
}
