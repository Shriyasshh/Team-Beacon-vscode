import * as vscode from "vscode";

import { EXTENSION_ID, COMMANDS } from "./constants.js";

/**
 * Called by VS Code when the extension is activated.
 * Registers all ForgePilot commands and initialises services.
 *
 * @param context - The extension context provided by VS Code.
 */
export function activate(context: vscode.ExtensionContext): void {
  const activateCmd = vscode.commands.registerCommand(COMMANDS.ACTIVATE, () => {
    vscode.window.showInformationMessage("ForgePilot is active and ready.");
  });

  context.subscriptions.push(activateCmd);

  vscode.window.showInformationMessage(`${EXTENSION_ID} activated.`);
}

/**
 * Called by VS Code when the extension is deactivated.
 * Cleans up resources, cancels running sessions, and disposes subscriptions.
 */
export function deactivate(): void {
  // Future: cancel active TrueForge sessions, dispose MCP servers, etc.
}
