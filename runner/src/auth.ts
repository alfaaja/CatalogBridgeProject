import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

export function createMemoryOnlyClient(url: string, publishableKey: string) {
  return createClient(url, publishableKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

async function promptHidden(prompt: string) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
    throw new Error("A TTY is required for masked password input.");
  }
  stdout.write(prompt);
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding("utf8");
  let value = "";
  try {
    for await (const chunk of stdin) {
      const character = String(chunk);
      if (character === "\r" || character === "\n") break;
      if (character === "\u0003") throw new Error("Authentication cancelled.");
      if (character === "\u007f" || character === "\b") {
        value = value.slice(0, -1);
      } else {
        value += character;
      }
    }
  } finally {
    stdin.setRawMode(false);
    stdin.pause();
    stdout.write("\n");
  }
  return value;
}

export async function authenticateRunner(client: SupabaseClient) {
  const prompt = createInterface({ input: stdin, output: stdout });
  let email: string;
  try {
    email = (await prompt.question("CatalogBridge email: ")).trim();
  } finally {
    prompt.close();
  }
  let password = await promptHidden("CatalogBridge password: ");
  try {
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.user || data.user.is_anonymous) {
      throw new Error("CatalogBridge authentication failed.");
    }
    return data.user.id;
  } finally {
    password = "";
  }
}
