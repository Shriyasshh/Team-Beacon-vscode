/**
 * ForgePilot — Shared Constants
 *
 * Central constants used across all modules. Import from here rather
 * than duplicating magic strings.
 */

/** Top-level extension identifier matching package.json "name". */
export const EXTENSION_ID = "forgepilot" as const;

/** Display name shown to the user. */
export const EXTENSION_DISPLAY_NAME = "ForgePilot" as const;

/**
 * VS Code command identifiers.
 * Every command registered in package.json "contributes.commands"
 * must have a corresponding entry here.
 */
export const COMMANDS = {
  /** Basic activation / health-check command. */
  ACTIVATE: `${EXTENSION_ID}.activate`,
} as const;

/**
 * VS Code configuration section.
 * Settings registered in package.json "contributes.configuration"
 * will live under this prefix.
 */
export const CONFIG_SECTION = EXTENSION_ID;

/**
 * Default values for extension configuration.
 * These will be overridden by user settings and .env.
 */
export const DEFAULTS = {
  /** Default TrueForge server URL for local development (verified IPv6 standalone port). */
  TRUEFORGE_BASE_URL: "http://[::1]:8795",
  /** Maximum context window tokens to send per turn. */
  MAX_CONTEXT_TOKENS: 32_000,
} as const;
