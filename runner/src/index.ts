import { chromium } from "playwright";

import { authenticateRunner, createMemoryOnlyClient } from "./auth.js";
import { loadConfig } from "./config.js";
import { acquireRunnerLock, runnerPaths } from "./filesystem.js";
import { claimJob, pollQueuedJob } from "./jobs.js";
import { processShopeeJob } from "./shopee-runner.js";

const POLL_INTERVAL_MS = 5_000;

async function main() {
  const config = loadConfig();
  const releaseLock = await acquireRunnerLock();
  try {
    const client = createMemoryOnlyClient(
      config.supabaseUrl,
      config.publishableKey,
    );
    await authenticateRunner(client);

    const context = await chromium.launchPersistentContext(
      runnerPaths().profile,
      {
        headless: false,
      },
    );
    process.stdout.write(
      `CatalogBridge Shopee runner started (${config.dryRun ? "DRY RUN" : "SAVE & ARCHIVE enabled"}).\n`,
    );

    try {
      while (true) {
        const queued = await pollQueuedJob(client);
        if (queued) {
          const claimed = await claimJob(client, queued);
          if (claimed)
            await processShopeeJob(client, context, claimed, config.dryRun);
        }
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      }
    } finally {
      await context.close();
      await client.auth.signOut({ scope: "local" });
    }
  } finally {
    await releaseLock();
  }
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Runner stopped safely.";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
