# ForgePilot — Project API Registry

> Every public function, class, and interface created in this project must be registered here with its exact signature, source location, description, owner, and status.
>
> Do **not** register speculative or planned APIs — only code that exists in the repository.

---

## Extension Entry Point

| Symbol | Signature | Source | Description | Owner | Status |
|---|---|---|---|---|---|
| `activate` | `(context: vscode.ExtensionContext) => void` | [`src/extension.ts`](../src/extension.ts) | VS Code extension activation entry point. Registers commands and initialises services. | M2 | ✅ Implemented |
| `deactivate` | `() => void` | [`src/extension.ts`](../src/extension.ts) | VS Code extension deactivation hook. Cleans up resources. | M2 | ✅ Stub |

## Constants

| Symbol | Type | Source | Description | Owner | Status |
|---|---|---|---|---|---|
| `EXTENSION_ID` | `"forgepilot"` | [`src/constants.ts`](../src/constants.ts) | Extension identifier matching package.json name. | M2 | ✅ Implemented |
| `EXTENSION_DISPLAY_NAME` | `"ForgePilot"` | [`src/constants.ts`](../src/constants.ts) | Human-readable display name. | M2 | ✅ Implemented |
| `COMMANDS.ACTIVATE` | `"forgepilot.activate"` | [`src/constants.ts`](../src/constants.ts) | VS Code command ID for the activation command. | M2 | ✅ Implemented |
| `CONFIG_SECTION` | `"forgepilot"` | [`src/constants.ts`](../src/constants.ts) | VS Code settings section prefix. | M2 | ✅ Implemented |
| `DEFAULTS.TRUEFORGE_BASE_URL` | `"http://localhost:8891"` | [`src/constants.ts`](../src/constants.ts) | Default TrueForge server URL. | M2 | ✅ Implemented |
| `DEFAULTS.MAX_CONTEXT_TOKENS` | `32_000` | [`src/constants.ts`](../src/constants.ts) | Default context budget. | M2 | ✅ Implemented |

## Shared Interfaces (`src/types.ts`) — DRAFT

| Symbol | Kind | Source | Description | Owner | Status |
|---|---|---|---|---|---|
| `ChangeStatus` | Type alias | [`src/types.ts`](../src/types.ts) | Status of a proposed change: `"pending" \| "reviewing" \| "applied" \| "rejected" \| "undone"` | M4 | 📝 Draft |
| `HunkStatus` | Type alias | [`src/types.ts`](../src/types.ts) | Status of a diff hunk: `"pending" \| "accepted" \| "rejected"` | M4 | 📝 Draft |
| `DiffHunk` | Interface | [`src/types.ts`](../src/types.ts) | A single diff hunk with id, line range, old/new text, and status. | M4 | 📝 Draft |
| `ProposedChange` | Interface | [`src/types.ts`](../src/types.ts) | A proposed file modification with hunks and review status. | M4 | 📝 Draft |
| `ContextItemType` | Type alias | [`src/types.ts`](../src/types.ts) | Kind of context item: `"file" \| "symbol" \| "search-result"` | M3 | 📝 Draft |
| `ContextItem` | Interface | [`src/types.ts`](../src/types.ts) | Context item with path, content, line range, relevance, and type. | M3 | 📝 Draft |
| `ToolResult` | Interface | [`src/types.ts`](../src/types.ts) | Tool execution result: `{ success, output, error? }` | M4 | 📝 Draft |
| `ToolDefinition` | Interface | [`src/types.ts`](../src/types.ts) | MCP tool definition with name, schema, handler, and approval flag. | M4 | 📝 Draft |
| `ForgePilotConfig` | Interface | [`src/types.ts`](../src/types.ts) | Extension runtime configuration. | M1 | 📝 Draft |

## Utilities

| Symbol | Signature | Source | Description | Owner | Status |
|---|---|---|---|---|---|
| `validateWorkspacePath` | `(filePath: string, workspaceRoot: string) => string` | [`src/utils/pathValidation.ts`](../src/utils/pathValidation.ts) | Validates a path is within the workspace root. Returns resolved absolute path. Throws `PathValidationError` on violation. | M4 | ✅ Implemented, tested |
| `isPathWithinWorkspace` | `(filePath: string, workspaceRoot: string) => boolean` | [`src/utils/pathValidation.ts`](../src/utils/pathValidation.ts) | Non-throwing variant of `validateWorkspacePath`. | M4 | ✅ Implemented, tested |
| `PathValidationError` | `class extends Error` | [`src/utils/pathValidation.ts`](../src/utils/pathValidation.ts) | Error thrown when path escapes workspace boundary. | M4 | ✅ Implemented, tested |
| `getOutputChannel` | `() => vscode.OutputChannel` | [`src/utils/logging.ts`](../src/utils/logging.ts) | Get or create the shared ForgePilot output channel. | M2 | ✅ Implemented |
| `log` | `(level: LogLevel, message: string, data?: unknown) => void` | [`src/utils/logging.ts`](../src/utils/logging.ts) | Timestamped, level-tagged log to the output channel. | M2 | ✅ Implemented |
| `disposeLogger` | `() => void` | [`src/utils/logging.ts`](../src/utils/logging.ts) | Dispose the output channel. | M2 | ✅ Implemented |
| `LogLevel` | Type alias | [`src/utils/logging.ts`](../src/utils/logging.ts) | `"debug" \| "info" \| "warn" \| "error"` | M2 | ✅ Implemented |
| `ForgePilotError` | `class extends Error` | [`src/utils/errors.ts`](../src/utils/errors.ts) | Base error with typed `code` field. | Shared | ✅ Implemented, tested |
| `ForgePilotErrorCode` | Type alias | [`src/utils/errors.ts`](../src/utils/errors.ts) | Union of known error codes. | Shared | ✅ Implemented |

## Commands (VS Code)

| Command ID | Title | Handler Location | Status |
|---|---|---|---|
| `forgepilot.activate` | ForgePilot: Activate | [`src/extension.ts`](../src/extension.ts) | ✅ Registered |

---

## Pending Registrations (Member Responsibilities)

### Member 1 — TrueForge Integration
- `TrueForgeAdapter` class / session management functions — after SDK verification
- `SessionState` type updates — after SDK type inspection
- Agent definition file (`agent/forgepilot.yaml`) — after format verification

### Member 3 — Context Engine
- `ContextEngine` class — file discovery, ranking, budget
- `fileDiscovery`, `symbolSearch` functions

### Member 4 — MCP Tools & Diff Review
- MCP tool implementations (`readFile`, `searchFiles`, `listFiles`, `writeFile`, `terminal`)
- `DiffManager`, `HunkReview`, `ApplyManager`, `UndoManager` classes
- Tool registry

