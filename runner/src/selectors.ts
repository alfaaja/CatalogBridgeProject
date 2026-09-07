import { RunnerError } from "./errors.js";

export const sellerCentreText = {
  archivedState: "Diarsipkan",
  createHeading: "Tambah Produk Baru",
  notDisplayedState: "Belum Ditampilkan",
  saveAndArchive: "Simpan & Arsipkan",
} as const;

type ExactButton = Readonly<{
  click(): Promise<void>;
  count(): Promise<number>;
}>;

export type ArchivePage = Readonly<{
  getByRole(
    role: "button",
    options: Readonly<{ exact: true; name: string }>,
  ): ExactButton;
}>;

export async function clickSaveAndArchive(page: ArchivePage, dryRun: boolean) {
  const button = page.getByRole("button", {
    exact: true,
    name: sellerCentreText.saveAndArchive,
  });
  if ((await button.count()) !== 1) {
    throw new RunnerError(
      "SAVE_ARCHIVE_BUTTON_NOT_FOUND",
      "The exact Save & Archive control was not uniquely available.",
    );
  }
  if (!dryRun) await button.click();
}
