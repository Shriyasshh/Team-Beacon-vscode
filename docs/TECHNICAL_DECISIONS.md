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
- TrueForge package/version: **Not yet installed — Member 1 responsibility**
- MCP package/version: **Not yet verified — awaiting TrueForge SDK inspection**
- Date verified: 2026-11-05

## TrueForge verification
- Official documentation URL: https://github.com/truefoundry/trueforge (web search, not yet locally verified)
- Package/repository URL: `@truefoundry/trueforge-sdk` on npm (~v0.183.x per web search)
- Installation command used: **Pending — Member 1 will run `npm install @truefoundry/trueforge-sdk@latest`**
- Verified agent-definition format/path: **Pending**
- Verified session/turn API: **Pending**
- Verified streaming/event API: **Pending**
- Verified cancellation API: **Pending**
- Verified MCP registration/tool schema: **Pending**
- Verified model configuration method: **Pending**
- Known limitations: **Pending**

## Architecture decisions
| Decision | Chosen approach | Alternatives considered | Reason | Date |
|---|---|---|---|---|
| Package manager | npm | pnpm, yarn | Ships with Node 22, simplest setup, no extra install | 2026-11-05 |
| Module system | Node16 (CJS output via esbuild) | ESM | VS Code extensions require CJS entry point; esbuild bundles to CJS | 2026-11-05 |
| Build tool | esbuild | webpack, tsc alone | Fast bundling, single output file, sourcemaps; recommended by VS Code docs | 2026-11-05 |
| TypeScript target | ES2022 | ES2020, ESNext | Matches Node 22 baseline; avoids needing polyfills | 2026-11-05 |
| VS Code engine | ^1.142.0 | Lower version | Matches installed VS Code; use latest API features | 2026-11-05 |
| Test framework | Vitest (unit) | Mocha, Jest | Fast, ESM-native, TypeScript-first; VS Code extension tests deferred to integration phase | 2026-11-05 |
| Linter | ESLint 9 + typescript-eslint | TSLint (deprecated) | Industry standard, flat config, type-aware rules | 2026-11-05 |
| Formatter | Prettier | ESLint formatting rules | Dedicated formatter avoids rule conflicts | 2026-11-05 |
| Extension entry | `dist/extension.js` (esbuild bundle) | `out/extension.js` (tsc) | Single file, tree-shaken, faster load | 2026-11-05 |
| TrueForge SDK | Deferred to Member 1 | Install now | AGENTS.md rule: verify actual API before coding against it | 2026-11-05 |

## Shared interfaces
Agreed TypeScript interfaces are in [`src/types.ts`](../src/types.ts). Status: **DRAFT — awaiting review by Members 1, 3, and 4 before parallel coding**.

Key types defined:
- `ProposedChange`, `DiffHunk` — diff review pipeline
- `ContextItem` — context engine output
- `ToolDefinition`, `ToolResult` — MCP tool contracts
- `ForgePilotConfig` — extension configuration

## Risks / open questions
| Question or risk | Owner | Next action | Status |
|---|---|---|---|
| TrueForge SDK actual types vs web-search types | Member 1 | Install SDK, inspect `index.d.ts`, update this doc | PENDING |
| MCP tool exposure mechanism (stdio vs SSE vs API) | Member 1 + 4 | Verify after SDK install | PENDING |
| TrueFoundry API key availability | Team | Check with competition organisers | PENDING |
| ripgrep not installed on dev machine | Member 3 | `sudo dnf install ripgrep` or Node fallback | PENDING |
| VS Code Chat Participant API stability at 1.142 | Member 2 | Check API docs before implementing chat UI | PENDING |
| Competition PDF not machine-parseable | Team | Read manually, update PROJECT_CONTEXT.md if needed | PENDING |
| License file empty | Team | Decide (MIT recommended) and fill | PENDING |
