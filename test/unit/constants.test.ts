import { describe, it, expect } from "vitest";

import {
  EXTENSION_ID,
  EXTENSION_DISPLAY_NAME,
  COMMANDS,
  DEFAULTS,
} from "../../src/constants.js";

describe("constants", () => {
  it("EXTENSION_ID is 'forgepilot'", () => {
    expect(EXTENSION_ID).toBe("forgepilot");
  });

  it("EXTENSION_DISPLAY_NAME is 'ForgePilot'", () => {
    expect(EXTENSION_DISPLAY_NAME).toBe("ForgePilot");
  });

  it("COMMANDS.ACTIVATE is prefixed with the extension ID", () => {
    expect(COMMANDS.ACTIVATE).toBe("forgepilot.activate");
  });

  it("DEFAULTS.TRUEFORGE_BASE_URL is a valid localhost URL", () => {
    expect(() => new URL(DEFAULTS.TRUEFORGE_BASE_URL)).not.toThrow();
  });

  it("DEFAULTS.MAX_CONTEXT_TOKENS is a positive integer", () => {
    expect(DEFAULTS.MAX_CONTEXT_TOKENS).toBeGreaterThan(0);
    expect(Number.isInteger(DEFAULTS.MAX_CONTEXT_TOKENS)).toBe(true);
  });
});
