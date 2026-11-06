# Member 4 — MCP, Diff Safety and Testing Lead

Branch: `feature/mcp-diff-review`.

Read `AGENTS.md`, `docs/PROJECT_CONTEXT.md`, `docs/TEAM_WORKFLOW.md`, and `docs/PROJECT_API_REGISTRY.md` before coding.

Own safe workspace tools, MCP exposure using verified schemas, proposed changes, diff generation, hunk accept/reject, safe apply, undo and cross-feature tests. Agree `ProposedChange`, `DiffHunk`, approval and tool-result types with M1/M3. Implement T-01 to T-10. Start with read-only tools and workspace path validation. Ensure generated changes are proposals only until explicitly approved; detect stale files; test path traversal, rejected hunks, cancellation and failures. Do not implement an agent/model loop. Coordinate with M1/M3. Own integrated verification of Flask Tasks A/B/C. Update registry with exact signatures and actual test results.
