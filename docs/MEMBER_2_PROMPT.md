# Member 2 — VS Code Extension and UI Lead

Branch: `feature/vscode-ui`.

Read `AGENTS.md`, `docs/PROJECT_CONTEXT.md`, `docs/TEAM_WORKFLOW.md`, and `docs/PROJECT_API_REGISTRY.md` before coding.

Own the extension scaffold, activation/disposal, commands, interaction surface, inline-edit entry point, streaming display and cancellation controls. Agree on A-01/A-03/A-04 and `AgentEvent` with M1 before wiring services. Implement U-01 to U-08 from the registry. Start with activation and one command, then add idle/running/streaming/cancelling/completed/error states and tests. Do not implement TrueForge calls, a model loop, context indexing or direct workspace writes. Use M1 agent interface, M3 context interface and M4 proposal/review interface. Update registry with exact signatures and test results.
