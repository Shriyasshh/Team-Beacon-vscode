import { describe, it, expect } from "vitest";

import { ForgePilotError } from "../../src/utils/errors.js";
import type { ForgePilotErrorCode } from "../../src/utils/errors.js";

describe("ForgePilotError", () => {
  it("carries the correct error code", () => {
    const err = new ForgePilotError("PATH_VALIDATION", "bad path");
    expect(err.code).toBe("PATH_VALIDATION");
    expect(err.message).toBe("bad path");
    expect(err.name).toBe("ForgePilotError");
  });

  it("is an instance of Error", () => {
    const err = new ForgePilotError("CANCELLED", "user cancelled");
    expect(err).toBeInstanceOf(Error);
  });

  it("supports all defined error codes", () => {
    const codes: ForgePilotErrorCode[] = [
      "PATH_VALIDATION",
      "STALE_FILE",
      "TOOL_EXECUTION",
      "SESSION_ERROR",
      "CANCELLED",
      "UNAUTHORIZED",
      "NETWORK_SECURITY",
      "UNREACHABLE_SERVER",
      "MODEL_ERROR",
    ];
    for (const code of codes) {
      const err = new ForgePilotError(code, `test ${code}`);
      expect(err.code).toBe(code);
    }
  });
});
