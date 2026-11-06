# Technical Decisions and Verification Log

Use this file to record decisions based on actual repository inspection and official documentation. Do not fill it with guesses.

## Environment
- OS: Fedora 44 (Kernel 7.2.13-200.fc44.x86_64)
- Node.js: v22.23.1
- npm: 10.9.8
- VS Code: 1.142.0 (engine targeted: ^1.142.0)
- TypeScript: 5.9.3
- esbuild: 0.24.2
- Vitest: 3.2.7
- ESLint: 9.39.5 (typescript-eslint: 8.72.1)
- Prettier: 3.9.10
- @types/vscode: 1.145.0
- @types/node: 22.20.5
- @vscode/vsce: 3.9.2
- TrueForge package/version: `@truefoundry/trueforge-sdk@0.184.1` (pinned exact)
- TrueForge server version: `@truefoundry/trueforge@0.184.1` (standalone, SQLite)
- MCP package/version: `@modelcontextprotocol/sdk@1.32.2` (pinned exact)
- Date verified: 2026-11-05

## TrueForge verification
- Official documentation URL: https://github.com/truefoundry/trueforge (API docs: https://trueforge.dev/api/use-agent)
- Package/repository URL: https://www.npmjs.com/package/@truefoundry/trueforge-sdk
- Installation command used: `npm install --save-exact @truefoundry/trueforge-sdk@0.184.1 @modelcontextprotocol/sdk@1.32.2`
- Verified agent-definition format/path:
  - Supports inline specification via `{ agent: { spec: AgentSpec } }` or named agents via `{ agent: { name: string } }`.
  - `AgentSpec` schema requires: `model: { name: "provider/modelId" }` (e.g. `google-gemini/gemini-3-5-flash`), `instructions: string` (system prompt), `mcpServers?: McpServer[]`.
  - Server stores definitions in local SQLite at `~/.local/share/trueforge/db/db.sqlite`.
- Verified session/turn API:
  - `client = new TrueForge({ baseUrl: "http://[::1]:8795", token?: string })`
  - Session create: `const session = await client.sessions.create({ agent: { spec: ... } })` -> returns `{ data: { id: string, ... } }` (ULID format).
  - Turn execution: `const stream = await client.sessions.createTurnStream(sessionId, { input: [{ type: "user.message", content: "..." }] })`
- Verified streaming/event API:
  - Consumed via standard `for await (const event of stream)` async iterator.
  - Events have discriminator property `type`:
    - `turn.created`: indicates turn initialized with unique turn ID.
    - `model.message`: full model message event.
    - `model.message.delta`: incremental streaming chunks with `.content` property.
    - `mcp.initialize`: indicates MCP client connection established with registered tools.
    - `tool.response`: confirms tool execution result returned to model loop.
    - `turn.done`: terminal event containing `state: { status: "done" | "cancelled" | "error", output?, completedAt, metrics }`.
- Verified cancellation API:
  - `await client.sessions.cancel(sessionId)` cancels the active turn.
  - Causes the in-flight SSE stream to emit `turn.done` with `state: { status: "cancelled", reason: "client-cancelled" }`.
- Verified MCP registration/tool schema:
  - Supported transports: `remote` (`url: "http://.../sse"` or `streamable-http`).
  - Registered via `client.settings.mcpServers.createOrUpdate({ manifest: { name, type: "remote", url, description } })`.
  - Tools attached to agent sessions via `spec.mcpServers: [{ name: "server-name", preload: true }]`.
  - Tool schemas adhere to `@modelcontextprotocol/sdk` (ToolSchema / JSON Schema).
  - Human approval gating: supported via `requireApprovalForTools: ["@destructive", "@write"]` or specific tool names.
- Verified model configuration method:
  - Model providers configured centrally on TrueForge server (e.g. `google-gemini` with `gemini-3-5-flash`, `gemini-flash-latest`).
  - Zero model API keys, tokens or provider secrets in ForgePilot extension code or Git repository.
- Known limitations & server quirks:
  - Server defaults to binding IPv6 loopback `[::1]:<port>` on Linux. Use `http://[::1]:8795` for local connections.
  - Default standalone port is `8790` (can be configured via `--port <n>`).
  - SSRF guard (`assertSafeOutboundUrl`) blocks loopback/private hosts (`127.0.0.1`, `::1`, `localhost`) by default.
  - For local workspace MCP server integration, start TrueForge server with `NETWORK_POLICY_ENABLED=false` or configure `OUTBOUND_URL_ALLOWED_HOSTS`.

## Architecture decisions
| Decision | Chosen approach | Alternatives considered | Reason | Date |
|---|---|---|---|---|
| Package manager | npm | pnpm, yarn | Ships with Node 22, simplest setup, no extra install | 2026-11-05 |
| Module system | Node16 (CJS output via esbuild) | ESM | VS Code extensions require CJS entry point; esbuild bundles to CJS | 2026-11-05 |
| Build tool | esbuild | webpack, tsc alone | Fast bundling, single output file, sourcemaps; recommended by VS Code docs | 2026-11-05 |
| TypeScript target | ES2022 | ES2020, ESNext | Matches Node 22 baseline; avoids needing polyfills | 2026-11-05 |
| VS Code engine | ^1.142.0 | Lower version | Matches installed VS Code; use latest API features | 2026-11-05 |
| Test framework | Vitest | Mocha, Jest | Fast, ESM-native, TypeScript-first; supports unit & integration tests | 2026-11-05 |
| Linter | ESLint 9 + typescript-eslint | TSLint (deprecated) | Industry standard, flat config, type-aware rules | 2026-11-05 |
| Formatter | Prettier | ESLint formatting rules | Dedicated formatter avoids rule conflicts | 2026-11-05 |
| Extension entry | `dist/extension.js` (esbuild bundle) | `out/extension.js` (tsc) | Single file, tree-shaken, faster load | 2026-11-05 |
| TrueForge SDK | `@truefoundry/trueforge-sdk@0.184.1` | Direct HTTP/fetch | Official SDK provides full typed contracts and SSE stream parsing | 2026-11-05 |
| MCP SDK | `@modelcontextprotocol/sdk@1.32.2` | Custom JSON-RPC | Official MCP SDK matches TrueForge internal MCP client transport | 2026-11-05 |
| MCP Transport | Remote SSE / HTTP on local port | stdio | TrueForge harness communicates with MCP servers via remote URLs (`RemoteMcpServerManifest`) | 2026-11-05 |
| Agent Loop Ownership | TrueForge server owns loop | Extension-side loop | Strictly required by competition rule #3 | 2026-11-05 |

## Shared interfaces
Agreed TypeScript interfaces are in [`src/types.ts`](../src/types.ts).
Internal contracts map to TrueForge verified APIs:
- `SessionState`: tracks TrueForge `session.data.id` and active turn state.
- `ToolDefinition`: mapped to `@modelcontextprotocol/sdk` tool declarations.
- `AgentEvent`: normalized union mapped from TrueForge `TurnStreamingEvent` types.

## Risks / open questions
| Question or risk | Owner | Next action | Status |
|---|---|---|---|
| TrueForge SDK actual types vs web-search types | Member 1 | Verified against `@truefoundry/trueforge-sdk@0.184.1` | ✅ RESOLVED |
| MCP tool exposure mechanism | Member 1 + 4 | Verified: HTTP/SSE MCP server with `NETWORK_POLICY_ENABLED=false` | ✅ RESOLVED |
| Server cancellation behavior | Member 1 | Verified: `client.sessions.cancel(id)` emits `turn.done` with `status: "cancelled"` | ✅ RESOLVED |
| Model provider configuration | Member 1 | Verified: configured in TrueForge server (`google-gemini`), zero keys in code | ✅ RESOLVED |
| TrueFoundry API key availability | Team | Verified working locally with standalone TrueForge | ✅ RESOLVED |
| ripgrep not installed on dev machine | Member 3 | `sudo dnf install ripgrep` or Node fallback for symbol search | PENDING (M3) |
| VS Code Chat Participant API stability at 1.142 | Member 2 | Check API docs before implementing chat UI | PENDING (M2) |
| Competition PDF not machine-parseable | Team | Read manually, update PROJECT_CONTEXT.md if needed | PENDING (Team) |
