# Member 1 — TrueForge Integration Lead

Branch: `feature/trueforge-integration`.

Read `AGENTS.md`, `docs/PROJECT_CONTEXT.md`, `docs/TEAM_WORKFLOW.md`, `docs/TECHNICAL_DECISIONS.md`, and `docs/PROJECT_API_REGISTRY.md` before coding.

Own the only TrueForge integration boundary. Verify the exact package/version and official docs for agent definition, session/run lifecycle, streaming/events, cancellation, MCP/tool integration and model configuration. Record evidence in `TECHNICAL_DECISIONS.md`.

Implement A-01 to A-07 in the registry after the team agrees on contracts. Build a thin adapter that starts a TrueForge-managed run, emits normalized events, supports cancellation/disposal and maps failures to safe actionable errors. Prove invalid-key/unreachable-endpoint behavior. Do not create a parallel model loop or call provider APIs directly. Coordinate shared types with M2/M4. Update the registry with exact signatures, source paths and actual test results in the same PR.
