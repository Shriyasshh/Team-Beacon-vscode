import { describe, it, expect } from "vitest";
import * as path from "node:path";

import {
  validateWorkspacePath,
  isPathWithinWorkspace,
  PathValidationError,
} from "../../src/utils/pathValidation.js";

const WORKSPACE = "/home/user/project";

describe("validateWorkspacePath", () => {
  it("accepts a file directly inside the workspace", () => {
    const result = validateWorkspacePath("README.md", WORKSPACE);
    expect(result).toBe(path.join(WORKSPACE, "README.md"));
  });

  it("accepts a file in a subdirectory", () => {
    const result = validateWorkspacePath("src/index.ts", WORKSPACE);
    expect(result).toBe(path.join(WORKSPACE, "src", "index.ts"));
  });

  it("accepts the workspace root itself", () => {
    const result = validateWorkspacePath(".", WORKSPACE);
    expect(result).toBe(path.resolve(WORKSPACE));
  });

  it("accepts an absolute path within the workspace", () => {
    const abs = path.join(WORKSPACE, "src", "app.ts");
    const result = validateWorkspacePath(abs, WORKSPACE);
    expect(result).toBe(abs);
  });

  it("rejects a path that traverses above the workspace", () => {
    expect(() =>
      validateWorkspacePath("../../../etc/passwd", WORKSPACE),
    ).toThrow(PathValidationError);
  });

  it("rejects a deeply nested traversal", () => {
    expect(() => validateWorkspacePath("src/../../..", WORKSPACE)).toThrow(
      PathValidationError,
    );
  });

  it("rejects an absolute path outside the workspace", () => {
    expect(() => validateWorkspacePath("/etc/passwd", WORKSPACE)).toThrow(
      PathValidationError,
    );
  });

  it("throws on empty filePath", () => {
    expect(() => validateWorkspacePath("", WORKSPACE)).toThrow(
      PathValidationError,
    );
  });

  it("throws on empty workspaceRoot", () => {
    expect(() => validateWorkspacePath("file.ts", "")).toThrow(
      PathValidationError,
    );
  });
});

describe("isPathWithinWorkspace", () => {
  it("returns true for a valid workspace path", () => {
    expect(isPathWithinWorkspace("src/index.ts", WORKSPACE)).toBe(true);
  });

  it("returns false for a path outside the workspace", () => {
    expect(isPathWithinWorkspace("../../../etc/passwd", WORKSPACE)).toBe(false);
  });

  it("returns false for empty inputs", () => {
    expect(isPathWithinWorkspace("", WORKSPACE)).toBe(false);
    expect(isPathWithinWorkspace("file.ts", "")).toBe(false);
  });
});
