import {
  processLogSchema,
  type ProcessLogInput,
} from "./persistence"
import { createClient } from "./server"

type ProcessLogResult =
  | Readonly<{ ok: true }>
  | Readonly<{
      ok: false
      error: "DATABASE_WRITE_FAILED" | "INVALID_LOG_INPUT"
    }>

export async function appendProcessLog(
  input: ProcessLogInput
): Promise<ProcessLogResult> {
  const parsedInput = processLogSchema.safeParse(input)

  if (!parsedInput.success) {
    return { ok: false, error: "INVALID_LOG_INPUT" }
  }

  try {
    const supabase = await createClient()
    const event = parsedInput.data
    const { error } = await supabase.from("process_logs").insert({
      details: event.details,
      message: event.message,
      product_id: event.productId,
      stage: event.stage,
      status: event.status,
    })

    return error
      ? { ok: false, error: "DATABASE_WRITE_FAILED" }
      : { ok: true }
  } catch {
    return { ok: false, error: "DATABASE_WRITE_FAILED" }
  }
}
