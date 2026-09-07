import { z } from "zod";

const configSchema = z.object({
  CATALOGBRIDGE_SUPABASE_PUBLISHABLE_KEY: z.string().trim().min(20),
  CATALOGBRIDGE_SUPABASE_URL: z
    .url()
    .refine((value) => new URL(value).protocol === "https:"),
  AUTOMATION_DRY_RUN: z.enum(["true", "false"]).default("true"),
});

export function loadConfig(environment: NodeJS.ProcessEnv = process.env) {
  const result = configSchema.safeParse(environment);
  if (!result.success) throw new Error("Invalid runner configuration.");
  const parsed = result.data;
  return {
    dryRun: parsed.AUTOMATION_DRY_RUN !== "false",
    publishableKey: parsed.CATALOGBRIDGE_SUPABASE_PUBLISHABLE_KEY,
    supabaseUrl: parsed.CATALOGBRIDGE_SUPABASE_URL,
  } as const;
}
