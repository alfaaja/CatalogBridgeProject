// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  confirmSellerCentreHandoffAction: vi.fn(),
  prepareShopeeHandoffAction: vi.fn(),
}));

import type { ShopeeHandoffManifest } from "@/lib/shopee-handoff";

import { ShopeeHandoffView } from "./shopee-handoff-view";

const manifest: ShopeeHandoffManifest = {
  attributes: [{ name: "Material", value: "Stainless Steel" }],
  brand: "JEP",
  category: { id: null, path: "Home > Kitchen" },
  declarations: {
    condition: "NEW",
    dangerousProduct: "NO",
    preorder: "NO",
  },
  description: "Description",
  externalChecks: {
    notes: ["Shipping service availability must be confirmed."],
    shippingServices: "SELLER_CENTRE_REQUIRED",
    unsupported: ["Video", "Wholesale"],
  },
  generatedAt: "2026-09-05T10:00:00.000Z",
  images: [
    {
      isPrimary: true,
      position: 0,
      url: "https://static.jakmall.id/image.jpg",
    },
  ],
  offer: {
    mode: "BASE_LISTING",
    sellingPriceIdr: 79_900,
    sku: "OMHA5ISV",
    sourceMode: "BASE_VARIANT",
    stock: 5,
  },
  physical: {
    dimensionsCm: { height: null, length: null, width: null },
    weightGrams: 250,
  },
  productId: "11111111-1111-4111-8111-111111111111",
  schemaVersion: 1,
  snapshotFingerprint: "a".repeat(64),
  title: "JEP Product",
};

describe("Shopee guided handoff view", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.useRealTimers();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("shows only the preparation explanation before current evidence exists", () => {
    render(
      <ShopeeHandoffView
        evidence={{ prepared: false, reviewerConfirmed: false }}
        manifest={null}
        productId={manifest.productId}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Prepare handoff package" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/transfer them to Shopee Seller Centre manually/i),
    ).toBeInTheDocument();
    expect(screen.queryByText("JEP Product")).not.toBeInTheDocument();
  });

  it("renders the prepared allowlisted package with restrained copy controls", () => {
    render(
      <ShopeeHandoffView
        evidence={{ prepared: true, reviewerConfirmed: false }}
        manifest={manifest}
        productId={manifest.productId}
      />,
    );

    expect(screen.getByText("JEP Product")).toBeInTheDocument();
    expect(screen.getByText("Material")).toBeInTheDocument();
    expect(screen.getByText("Stainless Steel")).toBeInTheDocument();
    expect(screen.getByText("OMHA5ISV")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Copy title" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Copy description" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Copy full handoff summary" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Copy/u })).toHaveLength(3);

    expect(document.body.textContent).not.toMatch(
      /Upload successful|Submitted|Published|Synced to Shopee|Shopee verified/u,
    );
  });

  it("reports clipboard success and failure accessibly without implying transfer", async () => {
    const writeText = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("denied"));
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(
      <ShopeeHandoffView
        evidence={{ prepared: true, reviewerConfirmed: false }}
        manifest={manifest}
        productId={manifest.productId}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Copy title" }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Title copied. Nothing was sent to Shopee.",
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Copy description" }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Description could not be copied. Copy it manually.",
      ),
    );
  });

  it("requires three explicit attestations and labels confirmation as reviewer evidence", () => {
    render(
      <ShopeeHandoffView
        evidence={{ prepared: true, reviewerConfirmed: false }}
        manifest={manifest}
        productId={manifest.productId}
      />,
    );

    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
    expect(
      screen.getByLabelText(/current CatalogBridge values were transferred/i),
    ).toBeRequired();
    expect(
      screen.getByLabelText(
        /accepted the product.*Belum Ditampilkan.*Diarsipkan/i,
      ),
    ).toBeRequired();
    expect(
      screen.getByLabelText(/shipping and service checks were completed/i),
    ).toBeRequired();
    expect(
      screen.getByRole("button", { name: "Confirm manual handoff" }),
    ).toBeInTheDocument();
  });

  it("shows current reviewer-confirmed evidence without independent Shopee claims", () => {
    render(
      <ShopeeHandoffView
        evidence={{ prepared: true, reviewerConfirmed: true }}
        manifest={manifest}
        productId={manifest.productId}
      />,
    );

    expect(screen.getByText("Manual handoff confirmed")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Reviewer confirmed that this snapshot was transferred to Shopee Seller Centre and is currently retained in an archived, non-published state/i,
      ),
    ).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/non-publishing action/i);
    expect(
      screen.queryByRole("button", { name: "Confirm manual handoff" }),
    ).not.toBeInTheDocument();
  });
});
