/**
 * ForgePilot — Custom Error Types
 *
 * Typed errors for actionable diagnostics.
 * Each error carries a `code` so callers can handle categories
 * without parsing message strings.
 */

/**
 * Error codes used by ForgePilot.
 * Add new codes here as new failure modes are implemented.
 */
export type ForgePilotErrorCode =
  | "PATH_VALIDATION"
  | "STALE_FILE"
  | "TOOL_EXECUTION"
  | "SESSION_ERROR"
  | "CANCELLED";

/**
 * Base error class for all ForgePilot-specific errors.
 */
export class ForgePilotError extends Error {
  readonly code: ForgePilotErrorCode;

  constructor(code: ForgePilotErrorCode, message: string) {
    super(message);
    this.name = "ForgePilotError";
    this.code = code;
  }
}
