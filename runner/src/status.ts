export const jobStatuses = [
  "QUEUED",
  "WAITING_FOR_RUNNER",
  "AUTH_REQUIRED",
  "RUNNING",
  "NEEDS_USER_ACTION",
  "SAVED_ARCHIVED",
  "FAILED",
] as const;

export type JobStatus = (typeof jobStatuses)[number];

const transitions: Readonly<Record<JobStatus, readonly JobStatus[]>> = {
  AUTH_REQUIRED: ["RUNNING", "NEEDS_USER_ACTION", "FAILED"],
  FAILED: [],
  NEEDS_USER_ACTION: ["RUNNING", "FAILED"],
  QUEUED: ["WAITING_FOR_RUNNER", "FAILED"],
  RUNNING: ["AUTH_REQUIRED", "NEEDS_USER_ACTION", "SAVED_ARCHIVED", "FAILED"],
  SAVED_ARCHIVED: [],
  WAITING_FOR_RUNNER: [
    "AUTH_REQUIRED",
    "RUNNING",
    "NEEDS_USER_ACTION",
    "FAILED",
  ],
};

export function canTransition(from: JobStatus, to: JobStatus) {
  return transitions[from].includes(to);
}
