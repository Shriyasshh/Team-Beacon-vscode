# ForgePilot — Project Context for AI Contributors

## 1. Project identity
- Team: Team Beacon
- Product: ForgePilot
- Repository: `Team-Beacon-vscode`
- Product type: VS Code extension / AI coding agent
- Competition: TrueFoundry Forge-a-thon — Techfest 2026–27
- Team size: 4
- Primary development environment: Fedora Linux
- Intended agent harness: TrueForge

## 2. Product goal
Build a VS Code extension that lets a developer ask an AI coding agent to understand and safely modify a repository. TrueForge is the agent harness and must own the agent loop. ForgePilot provides the VS Code experience, workspace/editor tools, context engineering, and safe change review.

## 3. Required capabilities
1. **Inline edit** — accept an instruction for selected code and propose an edit in the editor.
2. **Agent mode** — accept a repository-level task, discover relevant files without the developer naming them, use tools, and propose coordinated multi-file changes.
3. **Context assembly** — retrieve relevant files/symbols and assemble bounded, useful context for the agent.
4. **Diff review** — display proposed changes and support hunk-level accept/reject, safe application, and undo.
5. **Streaming and cancellation** — show progress/output as it arrives and allow the user to cancel an active run.
6. **Resilience** — handle invalid credentials, unavailable endpoints, timeouts, tool errors, and cancellation without freezing VS Code or leaving partial/unapproved edits.

## 4. Fixed competition tasks / acceptance criteria

### Task A — Inline edit
Target repository: `pallets/flask`
Release tag: `3.1.3`
Commit: `22d92470`
Target file: `src/flask/helpers.py`
Target function: `get_debug_flag`

Instruction to run through ForgePilot:
> Treat the values 'off' and 'n' as false as well, case-insensitively, and update the docstring to list every value that is treated as false.

Verification command:
```bash
FLASK_DEBUG=off python -c "from flask.helpers import get_debug_flag; print(get_debug_flag())"
```
Expected output: `False`.

The demo should show the user instruction, selected-code/inline-edit flow, proposed diff, review, and resulting behavior.

### Task B — Agent mode
The user instruction must not name files:
```text
Add a new built-in CLI command flask config that
prints the loaded application's configuration
as JSON, masking the values of any key containing
SECRET, PASSWORD, TOKEN or KEY as "***".

It must appear in flask --help, be covered by a
test, and be documented alongside the other
built-in commands.
```

Acceptance criteria:
- Agent discovers the necessary files itself; the developer does not supply file names.
- At least three files are discovered and changed as needed (implementation, tests, and documentation are expected areas; let the repository determine exact paths).
- Command appears in `flask --help`.
- Sensitive configuration values are masked for keys containing `SECRET`, `PASSWORD`, `TOKEN`, or `KEY`.
- JSON output is valid.
- Tests pass.

Verification command:
```bash
pytest tests/test_cli.py -q
```
Run the command against a test Flask application and demonstrate masked JSON. Show TrueForge session/tool activity in the demo where possible.

### Task C — Resilience
- Configure an invalid API key or unreachable model endpoint through TrueForge.
- Repeat Task A.
- VS Code must remain responsive.
- Show a clear actionable error or a configured automatic fallback supported by TrueForge.
- No files should be changed by a failed or unapproved generation. Verify using `git status` and/or a clean diff.
- Do not claim fallback support unless it is implemented and verified.

## 5. Evaluation priorities (100 points)
- Capability coverage — 30:
  - Inline edit: 10
  - Agent mode: 10
  - Streaming/cancellation: 10
- Technical depth — 45:
  - Context assembly: 15
  - Diff safety: 10
  - Resilience: 10
  - TrueForge integration depth: 10
- Presentation — 25:
  - Demo video: 10
  - Technical write-up: 15

Prioritize reliable end-to-end behavior and evidence over superficial feature count.

## 6. Architecture principles
Use a modular VS Code extension architecture. The following is a proposed responsibility map, not a mandate to create every file immediately:

- `src/extension.ts` — activation, command registration, lifecycle.
- `src/providers/` — VS Code-facing chat/inline-edit providers and UI adapters.
- `src/services/` — TrueForge adapter, workspace, diff, and orchestration-facing services. The TrueForge adapter must use verified APIs.
- `src/tools/` — MCP/editor/workspace tools exposed to TrueForge.
- `src/context/` — repository discovery, file/symbol retrieval, ranking, context budget.
- `src/review/` — proposed diff, hunk review, apply/reject, undo, stale-file checks.
- `webview/` — chat panel UI only if a webview is justified; prefer native VS Code UI when simpler.
- `agent/` — committed TrueForge agent definition/configuration in the exact format supported by the verified version.
- `test/` — unit, integration, and VS Code extension tests.
- `docs/` — architecture, decisions, setup, demo and submission documentation.

Do not create empty abstractions or speculative folders just to match this layout. Start with the smallest vertical slice and evolve the structure as real interfaces become clear.

## 7. Proposed technology choices
- Extension language: TypeScript.
- Runtime: Node.js version supported by the selected VS Code extension and TrueForge versions.
- Editor platform: VS Code Extension API.
- Agent harness: TrueForge.
- Tool integration: MCP as supported by the actual TrueForge version.
- Context helpers: ripgrep for fast search; add symbol parsing/indexing only where it improves retrieval.
- Diff/review: VS Code diff/editor APIs and a safe patch-application layer.
- Tests: use the test framework supported by the scaffold; Vitest may be used for isolated unit tests, with VS Code extension tests for integration.

These are proposed choices. Confirm compatibility and versions before installing or coding.

## 8. Out of scope unless explicitly required
- Building or hosting a separate model-serving backend.
- Direct model-provider calls from the extension.
- Training or fine-tuning a model.
- Tab autocomplete / FIM completion.
- User authentication or account management.
- VS Code Marketplace publishing.
- Unrelated product features.

## 9. Security and safety expectations
- Treat repository content, tool output, and model output as untrusted data.
- Prevent path traversal and writes outside the active workspace.
- Keep secrets out of logs, UI, telemetry, and Git.
- Require approval for file modifications and risky terminal operations.
- Make tool permissions and side effects visible.
- Detect stale-file conflicts before applying a diff.
- Apply only accepted hunks; rejected hunks must remain unapplied.
- Cancellation and errors must clean up temporary state and leave workspace files unchanged unless the user had already approved and applied a change.

## 10. Submission deliverables
- Public GitHub repository.
- Demo video, maximum 4 minutes.
- Technical write-up PDF, 1–3 pages.
- README with setup, architecture, configuration, testing, demo, team, attribution, and limitations.
- Do not commit secrets.

Technical write-up headings, in this order:
1. Team
2. Starting point
3. Architecture on TrueForge
4. How context is selected
5. Model setup
6. Scorecard
7. Tools used
8. Known limitations and what you would do with another month

## 11. Schedule context
Competition Round 1 submission deadline: 20 November 2026, 23:59 IST. Registration closes 15 November 2026. Verify dates against the official guide if it changes.

## 12. Definition of done
A feature is done only when:
- It is implemented in the actual project.
- Its behavior is covered by relevant tests or a documented manual test.
- Errors and cancellation are handled.
- No secret or unsafe side effect is introduced.
- Documentation is updated.
- The branch is pushed and a reviewed PR is ready.
