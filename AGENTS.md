# AI Contributor Instructions — ForgePilot

Read `docs/PROJECT_CONTEXT.md` and `docs/TEAM_WORKFLOW.md` before making changes.

## Non-negotiable rules
1. Treat the competition requirements in `docs/PROJECT_CONTEXT.md` as acceptance criteria.
2. Do not invent TrueForge APIs, SDK methods, event names, configuration formats, or agent-definition formats. Inspect the installed/current official TrueForge documentation and package version first. Record the verified version and links in `docs/TECHNICAL_DECISIONS.md`.
3. TrueForge must own the agent loop. The VS Code extension must not call model-provider APIs directly or implement a parallel agent loop.
4. Keep model configuration in TrueForge. Do not hardcode API keys, model credentials, or provider secrets.
5. Expose editor/workspace capabilities through the MCP/tool integration required by the verified TrueForge version.
6. Never silently write model-generated content into workspace files. Use a proposal/diff/review flow and apply only explicitly approved changes.
7. Support cancellation. Cancellation, tool failure, model failure, or rejected changes must not leave partial/unapproved edits behind.
8. Do not run destructive terminal commands without explicit user approval. Validate paths and constrain file operations to the active workspace.
9. Do not claim a task is complete unless its implementation and relevant tests have actually been run. Report commands, results, failures, and remaining gaps honestly.
10. Do not add unrelated backend services, authentication systems, Marketplace publishing, autocomplete, model fine-tuning, or other out-of-scope features unless the competition guide or team explicitly requires them.
11. Preserve licenses and attribution for any reused code. Do not copy code from other projects without checking its license and recording attribution.
12. Never commit `.env`, credentials, API keys, personal tokens, generated secrets, or machine-specific files.

## Working procedure
Before coding:
- Inspect the repository, current branch, `git status`, package files, and existing tests.
- Read the relevant official TrueForge documentation and inspect the actual installed package/API.
- Identify the smallest useful implementation slice and its acceptance tests.
- Check ownership boundaries in `docs/TEAM_WORKFLOW.md`.

While coding:
- Make focused changes only in your assigned area.
- Keep TypeScript types explicit and errors actionable.
- Add or update tests with each feature.
- Keep public interfaces stable; coordinate interface changes with the team.
- Do not overwrite another member's uncommitted work.
- Use small commits with conventional commit messages.

Before finishing:
- Run formatting, linting, type-checking, and relevant tests that actually exist in the repository.
- Inspect `git diff` and `git status`.
- Update docs for changed commands, interfaces, setup, or decisions.
- State what works, what was tested, exact test results, and what remains incomplete.

## Current project state
The initial uploaded repository snapshot contained only a README with the project title. Do not assume a scaffold, source code, branches, package manager, or TrueForge integration already exists. Verify the live checkout before acting.
