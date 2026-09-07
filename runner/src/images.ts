import { lookup } from "node:dns/promises";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { isIP } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { RunnerError } from "./errors.js";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_REDIRECTS = 3;

export type FetchImage = (
  input: string,
  init: Readonly<{ redirect: "manual"; signal: AbortSignal }>,
) => Promise<Response>;
export type ResolveHost = (hostname: string) => Promise<readonly string[]>;

export function validateImageUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "static.jakmall.id" &&
      !url.username &&
      !url.password &&
      !url.port
    );
  } catch {
    return false;
  }
}

function isPublicIp(address: string) {
  if (!isIP(address)) return false;
  if (address.includes(":")) {
    const normalized = address.toLowerCase();
    return !(
      normalized === "::1" ||
      normalized === "::" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe8") ||
      normalized.startsWith("fe9") ||
      normalized.startsWith("fea") ||
      normalized.startsWith("feb")
    );
  }
  const octets = address.split(".").map(Number);
  const [first = 0, second = 0] = octets;
  return !(
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    first >= 224
  );
}

async function defaultResolver(hostname: string) {
  const results = await lookup(hostname, { all: true, verbatim: true });
  return results.map((result) => result.address);
}

function imageExtension(contentType: string) {
  if (contentType === "image/jpeg") return ".jpg";
  if (contentType === "image/png") return ".png";
  if (contentType === "image/webp") return ".webp";
  return null;
}

function hasMatchingSignature(bytes: Uint8Array, contentType: string) {
  if (contentType === "image/jpeg")
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (contentType === "image/png")
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    );
  if (contentType === "image/webp")
    return (
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
    );
  return false;
}

async function downloadOne(
  initialUrl: string,
  fetchImage: FetchImage,
  resolveHost: ResolveHost,
) {
  let current = initialUrl;
  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    if (!validateImageUrl(current))
      throw new RunnerError(
        "IMAGE_DOWNLOAD_FAILED",
        "Image URL is not trusted.",
      );
    const url = new URL(current);
    const addresses = await resolveHost(url.hostname);
    if (
      addresses.length === 0 ||
      addresses.some((address) => !isPublicIp(address))
    ) {
      throw new RunnerError(
        "IMAGE_DOWNLOAD_FAILED",
        "Image host did not resolve to public addresses.",
      );
    }

    const response = await fetchImage(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(15_000),
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirects === MAX_REDIRECTS)
        throw new RunnerError(
          "IMAGE_DOWNLOAD_FAILED",
          "Image redirect was rejected.",
        );
      current = new URL(location, current).toString();
      continue;
    }
    if (!response.ok)
      throw new RunnerError("IMAGE_DOWNLOAD_FAILED", "Image download failed.");

    const contentType =
      response.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
    const extension = imageExtension(contentType);
    const advertised = Number(response.headers.get("content-length") ?? "0");
    if (!extension || advertised > MAX_IMAGE_BYTES)
      throw new RunnerError(
        "IMAGE_DOWNLOAD_FAILED",
        "Image type or size was rejected.",
      );
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (
      bytes.length === 0 ||
      bytes.length > MAX_IMAGE_BYTES ||
      !hasMatchingSignature(bytes, contentType)
    ) {
      throw new RunnerError(
        "IMAGE_DOWNLOAD_FAILED",
        "Downloaded bytes were not a supported image.",
      );
    }
    return { bytes, extension };
  }
  throw new RunnerError(
    "IMAGE_DOWNLOAD_FAILED",
    "Image download failed safely.",
  );
}

export async function downloadTrustedImages(
  urls: readonly string[],
  fetchImage: FetchImage = fetch,
  resolveHost: ResolveHost = defaultResolver,
) {
  const directory = await mkdtemp(join(tmpdir(), "catalogbridge-images-"));
  const paths: string[] = [];
  try {
    for (const [index, url] of urls.entries()) {
      const image = await downloadOne(url, fetchImage, resolveHost);
      const path = join(directory, `${index}${image.extension}`);
      await writeFile(path, image.bytes, { flag: "wx" });
      paths.push(path);
    }
    return {
      cleanup: async () => rm(directory, { force: true, recursive: true }),
      paths: paths as readonly string[],
    };
  } catch (error) {
    await rm(directory, { force: true, recursive: true });
    throw error instanceof RunnerError
      ? error
      : new RunnerError(
          "IMAGE_DOWNLOAD_FAILED",
          "Image download failed safely.",
        );
  }
}
