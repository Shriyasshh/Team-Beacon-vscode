# ForgePilot — Project API & Contract Registry

> This is the shared source of truth for Team Beacon. It records agreed application contracts, verified integration interfaces, actual implemented functions, descriptions, ownership, test results, and dependencies.
>
> **Contributor Rules:**
> 1. Read this registry and inspect actual source code before coding.
> 2. Do not invent TrueForge APIs. Verified SDK is `@truefoundry/trueforge-sdk@0.184.1`.
> 3. Do not silently change another member's public contract. Coordinate first.
> 4. Update this file in the same PR as each API addition or change.

---

## Verification Snapshot

- **Last reviewed**: 2026-11-06
- **Branch**: `feature/trueforge-integration`
- **Node / npm / TypeScript / VS Code**: Node v22.23.1 · npm 10.9.8 · TypeScript 5.9.3 · VS Code ^1.142.0
- **TrueForge SDK version**: `@truefoundry/trueforge-sdk@0.184.1` (verified live with standalone server `v0.184.1`)
- **MCP SDK version**: `@modelcontextprotocol/sdk@1.32.2` (verified live over SSE transport)
- **Active Verification Tests**: 4 test files, 35/35 tests passing (`npm test`)

---

# 1. Agreed Application-Level Contracts

The signatures below are **ForgePilot application-level contracts** agreed across all 4 members. They wrap the underlying TrueForge SDK and VS Code APIs to provide clean boundaries.

## Member 1 — TrueForge Integration

| ID | Contract Name | Signature | Description | Verified SDK Mechanism | Status |
|---|---|---|---|---|---|
| A-01 | `startSession` | `(options: SessionOptions) => Promise<string>` | Start a session in TrueForge with inline `AgentSpec` | `client.sessions.create({ agent: { spec } })` -> `res.data.id` | ✅ Agreed / Verified |
| A-02 | `runAgent` | `(sessionId: string, options: AgentRunOptions) => Promise<AsyncIterable<AgentEvent>>` | Submit turn to TrueForge and return streaming event iterator | `client.sessions.createTurnStream(sessionId, { input })` | ✅ Agreed / Verified |
| A-03 | `subscribeToEvents` | `(stream: AsyncIterable<AgentEvent>, handler: (event: AgentEvent) => void) => () => void` | Consume normalized stream events (deltas, tools, status) | Async iterator over `TurnStreamingEvent` | ✅ Agreed / Verified |
| A-04 | `cancelRun` | `(sessionId: string) => Promise<void>` | Interrupt in-flight model/tool execution | `client.sessions.cancel(sessionId)` -> `turn.done` with `status: "cancelled"` | ✅ Agreed / Verified |
| A-05 | `disposeSession` | `(sessionId: string) => Promise<void>` | Delete session and clean up server resources | `client.sessions.delete(sessionId)` | ✅ Agreed / Verified |
| A-06 | `mapTrueForgeError` | `(error: unknown) => ForgePilotError` | Map SDK / HTTP / network errors to typed `ForgePilotError` | Inspect `err instanceof TrueForgeError`, `.statusCode`, `.message` | ✅ Agreed / Verified |
| A-07 | `checkAgentAvailability`| `(baseUrl: string) => Promise<boolean>` | Health check server and model readiness without secrets | `client.agents.list()` / `client.models.list()` | ✅ Agreed / Verified |

## Member 2 — VS Code Extension & UI

| ID | Contract Name | Signature | Description | Status |
|---|---|---|---|---|
| U-01 | `activate` | `(context: vscode.ExtensionContext) => void` | Entry point: register commands, output channel, and services | ✅ Implemented |
| U-02 | `deactivate` | `() => void` | Clean up active subscriptions, dispose servers | ✅ Implemented (stub) |
| U-03 | `registerForgePilotCommands` | `(context: vscode.ExtensionContext) => vscode.Disposable[]` | Register chat, inline edit, cancel commands | 📝 Agreed |
| U-04 | `openAgentPanel` | `() => Promise<void>` | Focus/reveal chat or agent panel | 📝 Agreed |
| U-05 | `submitUserPrompt` | `(prompt: string) => Promise<void>` | Validate input and drive M1 `runAgent` | 📝 Agreed |
| U-06 | `startInlineEdit` | `(selection: vscode.Selection, instruction: string) => Promise<void>` | Selected-code inline edit pipeline | 📝 Agreed |
| U-07 | `renderAgentEvent` | `(event: AgentEvent) => void` | Render streaming text deltas and tool status chips in UI | 📝 Agreed |
| U-08 | `showUserError` | `(error: ForgePilotError) => void` | Display actionable notifications with recovery hints | 📝 Agreed |

## Member 3 — Context Engineering

| ID | Contract Name | Signature | Description | Status |
|---|---|---|---|---|
| C-01 | `discoverWorkspaceFiles` | `(options?: DiscoveryOptions) => Promise<WorkspaceFile[]>` | Discover workspace files respecting .gitignore, binary, size limits | 📝 Agreed |
| C-02 | `searchWorkspace` | `(query: string, options?: SearchOptions) => Promise<SearchMatch[]>` | Fast regex/content search within workspace | 📝 Agreed |
| C-03 | `extractSymbols` | `(file: WorkspaceFile) => Promise<SymbolInfo[]>` | Parse definitions/classes/functions from source | 📝 Agreed |
| C-04 | `rankContext` | `(query: string, candidates: ContextCandidate[]) => RankedContext[]` | Score and rank candidate files/symbols | 📝 Agreed |
| C-05 | `buildContextBundle` | `(query: string, options: BudgetOptions) => Promise<ContextBundle>` | Assemble bounded context within max token limit | 📝 Agreed |
| C-06 | `estimateContextSize` | `(bundle: ContextBundle) => number` | Estimate token size using character heuristics | 📝 Agreed |
| C-07 | `invalidateIndex` | `(changedFiles: string[]) => Promise<void>` | Invalidate cached context on file write | 📝 Agreed |

## Member 4 — MCP Tools, Diff Safety & Testing

| ID | Contract Name | Signature | Description | Status |
|---|---|---|---|---|
| T-01 | `readWorkspaceFile` | `(path: string) => Promise<string>` | Safely read file within workspace boundary | 📝 Agreed |
| T-02 | `searchWorkspaceTool` | `(query: string) => Promise<ToolResult>` | Expose workspace search as an MCP tool | 📝 Agreed |
| T-03 | `proposeFileChange` | `(input: ProposedChangeInput) => ProposedChange` | Create proposed patch; NEVER writes silently | 📝 Agreed |
| T-04 | `createDiff` | `(change: ProposedChange) => DiffHunk[]` | Parse diff into reviewable hunks | 📝 Agreed |
| T-05 | `acceptHunk` | `(changeId: string, hunkId: string) => Promise<ApplyResult>` | Apply single approved hunk after stale-file validation | 📝 Agreed |
| T-06 | `rejectHunk` | `(changeId: string, hunkId: string) => void` | Mark hunk rejected; leaves file untouched | 📝 Agreed |
| T-07 | `undoAppliedChange` | `(changeId: string) => Promise<UndoResult>` | Safely revert applied change from backup | 📝 Agreed |
| T-08 | `runWorkspaceCommand` | `(command: string, approval: boolean) => Promise<CommandResult>` | Execute allowlisted non-destructive command | 📝 Agreed |
| T-09 | `validateWorkspacePath`| `(filePath: string, workspaceRoot: string) => string` | Path traversal prevention (`../` guard) | ✅ Implemented, tested |
| T-10 | `checkFileVersion` | `(path: string, originalContent: string) => boolean` | Stale-file conflict detector before applying diff | 📝 Agreed |

---

# 2. Actual Implementation Ledger

| Symbol | Exact Signature | Owner | Status | Source Location | Tests + Result |
|---|---|---|---|---|---|
| `activate` | `(context: vscode.ExtensionContext) => void` | M2 | ✅ Implemented | [`src/extension.ts`](../src/extension.ts) | Verified in extension bundle |
| `deactivate` | `() => void` | M2 | ✅ Stub | [`src/extension.ts`](../src/extension.ts) | Verified |
| `validateWorkspacePath` | `(filePath: string, workspaceRoot: string) => string` | M4 | ✅ Implemented | [`src/utils/pathValidation.ts`](../src/utils/pathValidation.ts) | `pathValidation.test.ts` (12/12 passed) |
| `isPathWithinWorkspace` | `(filePath: string, workspaceRoot: string) => boolean` | M4 | ✅ Implemented | [`src/utils/pathValidation.ts`](../src/utils/pathValidation.ts) | `pathValidation.test.ts` |
| `PathValidationError` | `class extends Error` | M4 | ✅ Implemented | [`src/utils/pathValidation.ts`](../src/utils/pathValidation.ts) | `pathValidation.test.ts` |
| `getOutputChannel` | `() => vscode.OutputChannel` | M2 | ✅ Implemented | [`src/utils/logging.ts`](../src/utils/logging.ts) | Verified |
| `log` | `(level: LogLevel, message: string, data?: unknown) => void` | M2 | ✅ Implemented | [`src/utils/logging.ts`](../src/utils/logging.ts) | Verified |
| `disposeLogger` | `() => void` | M2 | ✅ Implemented | [`src/utils/logging.ts`](../src/utils/logging.ts) | Verified |
| `ForgePilotError` | `class extends Error` | Shared | ✅ Implemented | [`src/utils/errors.ts`](../src/utils/errors.ts) | `errors.test.ts` (3/3 passed) |
| `TrueForgeIntegrationSpike` | Vitest Suite (15 tests) | M1 | ✅ Implemented | [`test/integration/trueforgeSpike.test.ts`](../test/integration/trueforgeSpike.test.ts) | **15/15 passed live against server** |
| `MCPToolInvocationSpike` | Standalone verified script | M1 | ✅ Implemented | [`scripts/mcp-spike.mjs`](../scripts/mcp-spike.mjs) | Verified: TrueForge SSE -> MCP tool |
| `createTrueForgeClient` | `(baseUrl: string, token?: string) => TrueForge` | M1 | ✅ Implemented | [`src/integration/trueforgeAdapter.ts`](../src/integration/trueforgeAdapter.ts) | `trueforgeSpike.test.ts` (15/15 passed) |
| `startSession` (A-01) | `(client: TrueForge, options: SessionOptions) => Promise<string>` | M1 | ✅ Implemented | [`src/integration/trueforgeAdapter.ts`](../src/integration/trueforgeAdapter.ts) | `trueforgeSpike.test.ts` |
| `runAgent` (A-02) | `(client: TrueForge, sessionId: string, options: AgentRunOptions) => Promise<AsyncIterable<AgentEvent>>` | M1 | ✅ Implemented | [`src/integration/trueforgeAdapter.ts`](../src/integration/trueforgeAdapter.ts) | `trueforgeSpike.test.ts` |
| `subscribeToEvents` (A-03) | `(stream: AsyncIterable<AgentEvent>, handler: (event: AgentEvent) => void) => () => void` | M1 | ✅ Implemented | [`src/integration/trueforgeAdapter.ts`](../src/integration/trueforgeAdapter.ts) | `trueforgeSpike.test.ts` |
| `cancelRun` (A-04) | `(client: TrueForge, sessionId: string) => Promise<void>` | M1 | ✅ Implemented | [`src/integration/trueforgeAdapter.ts`](../src/integration/trueforgeAdapter.ts) | `trueforgeSpike.test.ts` |
| `disposeSession` (A-05) | `(client: TrueForge, sessionId: string) => Promise<void>` | M1 | ✅ Implemented | [`src/integration/trueforgeAdapter.ts`](../src/integration/trueforgeAdapter.ts) | `trueforgeSpike.test.ts` |
| `mapTrueForgeError` (A-06) | `(error: unknown) => ForgePilotError` | M1 | ✅ Implemented | [`src/integration/trueforgeAdapter.ts`](../src/integration/trueforgeAdapter.ts) | `trueforgeSpike.test.ts` |
| `checkAgentAvailability` (A-07) | `(baseUrl: string, token?: string) => Promise<boolean>` | M1 | ✅ Implemented | [`src/integration/trueforgeAdapter.ts`](../src/integration/trueforgeAdapter.ts) | `trueforgeSpike.test.ts` |

---

# 3. Normalized Event Registry

TrueForge `TurnStreamingEvent` items are mapped to normalized ForgePilot events in the adapter layer:

| Normalized Event | Mapped from TrueForge Event | Description | Consumer |
|---|---|---|---|
| `turn.created` | `type: "turn.created"` | Turn initialized with unique Turn ID | M2 UI (progress start) |
| `text.delta` | `type: "model.message.delta"` | Incremental assistant token/content chunk | M2 UI (streaming markdown) |
| `tool.started` | `type: "mcp.initialize"` / `tool.call` | Agent initiates MCP tool invocation | M2 UI (tool chip running) |
| `tool.completed` | `type: "tool.response"` | MCP tool returned output to agent | M2 UI (tool chip success) |
| `turn.completed` | `type: "turn.done"` with `status: "done"` | Turn finished successfully | M2 UI / M4 (diff review check) |
| `turn.cancelled` | `type: "turn.done"` with `status: "cancelled"` | User aborted turn | M2 UI / M4 (discard pending) |
| `turn.error` | `type: "turn.done"` with `status: "error"` / `TrueForgeError` | Model/server failure | M2 UI (actionable error display) |

---

# 4. Change Log

| Date | Member | Description | PR / Commit |
|---|---|---|---|
| 2026-11-05 | M2 | Initial extension scaffold, constants, path validation, errors | `c3206c1` |
| 2026-11-05 | M1 | Verified TrueForge SDK (`0.184.1`), MCP SDK (`1.32.2`), live turn streaming, cancellation, and MCP tool invocation spike | `feature/trueforge-integration` (`dc4ab96`) |
| 2026-11-06 | M1 | Closed verification gaps: outbound SSRF allowlist (`OUTBOUND_URL_ALLOWED_HOSTS`), 401 auth resilience tests, model failure handling, declarative agent definition (`agent/forgepilot.yaml`), two-tier approval architecture, and adapter implementation (A-01 to A-07) | `feature/trueforge-integration` |
