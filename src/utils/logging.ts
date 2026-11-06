/**
 * ForgePilot — Logging Utilities
 *
 * Centralised logging that writes to a VS Code OutputChannel.
 * Keeps secrets out of logs by design.
 */

import * as vscode from "vscode";

import { EXTENSION_DISPLAY_NAME } from "../constants.js";

let outputChannel: vscode.OutputChannel | undefined;

/**
 * Get or create the shared ForgePilot output channel.
 */
export function getOutputChannel(): vscode.OutputChannel {
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel(EXTENSION_DISPLAY_NAME);
  }
  return outputChannel;
}

/** Log levels matching standard severity. */
export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * Write a timestamped, level-tagged message to the output channel.
 *
 * @param level - Severity level.
 * @param message - The log message (must not contain secrets).
 * @param data - Optional structured data to append.
 */
export function log(level: LogLevel, message: string, data?: unknown): void {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  const suffix = data !== undefined ? ` ${JSON.stringify(data)}` : "";
  getOutputChannel().appendLine(`${prefix} ${message}${suffix}`);
}

/**
 * Dispose the output channel. Call from `deactivate()`.
 */
export function disposeLogger(): void {
  outputChannel?.dispose();
  outputChannel = undefined;
}
