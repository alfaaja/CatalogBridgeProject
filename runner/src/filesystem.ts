import { homedir } from "node:os";
import { join } from "node:path";
import { mkdir, open, unlink } from "node:fs/promises";

export function runnerPaths() {
  const root = join(homedir(), ".catalogbridge");
  return {
    evidence: join(root, "evidence"),
    profile: join(root, "shopee-profile"),
    root,
  } as const;
}

export async function acquireRunnerLock(root = runnerPaths().root) {
  await mkdir(root, { recursive: true });
  const lockPath = join(root, "runner.lock");
  let handle;
  try {
    handle = await open(lockPath, "wx");
    await handle.writeFile(String(process.pid), "utf8");
  } catch {
    throw new Error("Another CatalogBridge Shopee runner is already running.");
  }

  return async () => {
    await handle.close();
    await unlink(lockPath).catch(() => undefined);
  };
}
