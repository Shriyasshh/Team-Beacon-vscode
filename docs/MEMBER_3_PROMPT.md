# Member 3 — Context Engineering Lead

Branch: `feature/context-engine`.

Read `AGENTS.md`, `docs/PROJECT_CONTEXT.md`, `docs/TEAM_WORKFLOW.md`, and `docs/PROJECT_API_REGISTRY.md` before coding.

Own workspace discovery, safe file search, optional symbol extraction, ranking, context assembly, budget estimation and index invalidation. Agree `WorkspaceFile`, `ContextBundle`, search and symbol result types with M1/M4. Implement C-01 to C-07. Respect ignore rules, exclude binary/oversized/secret/generated/dependency files as appropriate, and test large repositories. Do not call models, orchestrate agents or write workspace files. Expose stable functions for M1/M4 to consume. Update registry with exact signatures and actual test results.
