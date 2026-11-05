/**
 * ForgePilot — Shared TypeScript Interfaces
 *
 * ⚠️  DRAFT — These interfaces must be reviewed and agreed upon
 * by all four team members before parallel implementation begins.
 *
 * Member 1 must verify TrueForge-facing types against the actual SDK.
 * Member 4 must verify tool/diff types against the MCP protocol.
 *
 * Do NOT import TrueForge SDK types here. This file defines the
 * extension's internal contracts only.
 */

// ---------------------------------------------------------------------------
// Proposed file changes
// ---------------------------------------------------------------------------

/** Status of a proposed change through the review pipeline. */
export type ChangeStatus =
  "pending" | "reviewing" | "applied" | "rejected" | "undone";

/** Status of an individual diff hunk. */
export type HunkStatus = "pending" | "accepted" | "rejected";

/**
 * A single diff hunk within a proposed change.
 * Represents one contiguous region of added/removed lines.
 */
export interface DiffHunk {
  /** Unique identifier for this hunk within its parent change. */
  readonly id: string;
  /** 1-based start line in the original file. */
  readonly startLine: number;
  /** 1-based end line (inclusive) in the original file. */
  readonly endLine: number;
  /** Original text being replaced. */
  readonly oldText: string;
  /** Proposed replacement text. */
  readonly newText: string;
  /** Current review status. */
  status: HunkStatus;
}

/**
 * A proposed file modification produced by the agent.
 * Must go through diff review before being applied.
 */
export interface ProposedChange {
  /** Absolute path within the workspace. */
  readonly filePath: string;
  /** File content at the time the proposal was created (for stale detection). */
  readonly originalContent: string;
  /** Proposed new file content. */
  readonly proposedContent: string;
  /** Parsed diff hunks for granular review. */
  readonly hunks: DiffHunk[];
  /** Overall status of this change. */
  status: ChangeStatus;
}

// ---------------------------------------------------------------------------
// Context retrieval
// ---------------------------------------------------------------------------

/** Kinds of context items the context engine can return. */
export type ContextItemType = "file" | "symbol" | "search-result";

/**
 * A single context item retrieved by the context engine.
 * Passed to TrueForge as part of the turn's context.
 */
export interface ContextItem {
  /** Path relative to workspace root. */
  readonly filePath: string;
  /** Retrieved content (full file or excerpt). */
  readonly content: string;
  /** 1-based start line, if this is an excerpt. */
  readonly startLine?: number;
  /** 1-based end line (inclusive), if this is an excerpt. */
  readonly endLine?: number;
  /** Relevance score (0–1, higher = more relevant). */
  readonly relevanceScore: number;
  /** Kind of context item. */
  readonly type: ContextItemType;
}

// ---------------------------------------------------------------------------
// Tool definitions (MCP tools exposed to TrueForge)
// ---------------------------------------------------------------------------

/**
 * Result returned from executing an MCP tool.
 */
export interface ToolResult {
  /** Whether the tool execution succeeded. */
  readonly success: boolean;
  /** Human-readable output or data payload. */
  readonly output: string;
  /** Error message if success is false. */
  readonly error?: string;
}

/**
 * Definition of a workspace tool exposed to TrueForge via MCP.
 *
 * ⚠️  The exact inputSchema format must be verified against
 * the TrueForge MCP integration once the SDK is installed.
 */
export interface ToolDefinition {
  /** Tool name as registered with TrueForge. */
  readonly name: string;
  /** Human-readable description shown to the agent. */
  readonly description: string;
  /** JSON Schema for the tool's input parameters. */
  readonly inputSchema: Record<string, unknown>;
  /** Handler function invoked when TrueForge calls this tool. */
  readonly handler: (input: Record<string, unknown>) => Promise<ToolResult>;
  /** Whether this tool requires explicit user approval before execution. */
  readonly requiresApproval: boolean;
}

// ---------------------------------------------------------------------------
// Extension configuration
// ---------------------------------------------------------------------------

/**
 * Runtime configuration for the ForgePilot extension.
 * Values come from VS Code settings, .env, or defaults.
 */
export interface ForgePilotConfig {
  /** Base URL of the TrueForge server. */
  readonly trueforgeBaseUrl: string;
  /** Optional auth token (sourced from environment, never hardcoded). */
  readonly trueforgeToken?: string;
  /** Agent name as registered in TrueForge. */
  readonly agentName: string;
  /** Maximum tokens of context to assemble per turn. */
  readonly maxContextTokens: number;
}
