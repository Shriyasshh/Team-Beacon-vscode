/**
 * ForgePilot — Path Validation Utilities
 *
 * Prevents path-traversal attacks and restricts file operations
 * to the active VS Code workspace. Used by every tool that
 * reads or writes files.
 */

import * as path from "node:path";

/**
 * Normalise and resolve a file path, then check that it falls
 * strictly within the given workspace root.
 *
 * @param filePath  - The path to validate (absolute or relative).
 * @param workspaceRoot - Absolute path of the workspace root.
 * @returns The resolved absolute path if valid.
 * @throws {PathValidationError} if the path escapes the workspace.
 */
export function validateWorkspacePath(
  filePath: string,
  workspaceRoot: string,
): string {
  if (!filePath || !workspaceRoot) {
    throw new PathValidationError(
      "Both filePath and workspaceRoot must be non-empty strings.",
    );
  }

  const resolvedRoot = path.resolve(workspaceRoot);
  const resolvedPath = path.resolve(resolvedRoot, filePath);

  // The resolved path must start with the workspace root followed by
  // a path separator (or be the root itself). This prevents "../" escapes
  // and symlink tricks at the string level.
  if (
    resolvedPath !== resolvedRoot &&
    !resolvedPath.startsWith(resolvedRoot + path.sep)
  ) {
    throw new PathValidationError(
      `Path "${filePath}" resolves to "${resolvedPath}" which is outside workspace root "${resolvedRoot}".`,
    );
  }

  return resolvedPath;
}

/**
 * Check whether a path is within the workspace without throwing.
 *
 * @param filePath - The path to check.
 * @param workspaceRoot - Absolute path of the workspace root.
 * @returns `true` if the path is safely within the workspace.
 */
export function isPathWithinWorkspace(
  filePath: string,
  workspaceRoot: string,
): boolean {
  try {
    validateWorkspacePath(filePath, workspaceRoot);
    return true;
  } catch {
    return false;
  }
}

/**
 * Error thrown when a file path fails workspace-boundary validation.
 */
export class PathValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PathValidationError";
  }
}
