# ForgePilot — Team Beacon

**ForgePilot** is a VS Code AI coding-agent extension powered by TrueForge.

It aims to help developers understand, explore, edit and refactor codebases using an autonomous AI agent, workspace context retrieval, MCP tools and safe diff review.

**Competition:** TrueFoundry Forge-a-thon — Techfest 2026–27  
**Team:** Team Beacon  
**Repository:** Team-Beacon-vscode  
**Team size:** 4

---

## 1. Project Capabilities

The project is being developed around these capabilities:

- Inline code editing.
- Autonomous multi-file agent mode.
- Workspace context discovery and retrieval.
- MCP-based workspace tools.
- Streaming responses and cancellation.
- Hunk-level diff review and approval.
- Safe file modifications and undo.
- Error handling and resilience through TrueForge.

These are project goals. Refer to the implementation and tests before treating a capability as complete.

## 2. Technology Stack

| Area | Technology |
|---|---|
| Extension | TypeScript |
| Editor | Visual Studio Code Extension API |
| Agent framework | TrueForge |
| Model | Google Gemini |
| Agent SDK | @truefoundry/trueforge-sdk |
| Tool integration | Model Context Protocol (MCP) |
| Bundling | esbuild |
| Testing | Vitest |
| Version control | Git and GitHub |

## 3. Prerequisites

Install the following before starting:

- Git
- Node.js 22.14 or newer
- npm
- Visual Studio Code 1.142 or newer

Check your installations:

```bash
git --version
node -v
npm -v
code --version
```

Node.js 22.14+ is the team's recommended baseline for the tested local TrueForge setup.

## 4. Clone the Repository

Every team member should clone the same repository.

```bash
git clone https://github.com/Shriyashhh/Team-Beacon-vscode.git
cd Team-Beacon-vscode
```

You need repository collaborator access to push your feature branch.

**Important:** Do not create separate repositories or forks when you already have collaborator access.

## 5. Install Project Dependencies

From the project root:

```bash
npm ci
```

This installs the exact dependencies recorded in package-lock.json.

Do not commit node_modules or generated build output.

## 6. Select Your Assigned Branch

Each member must work on their assigned feature branch.

| Member | Branch |
|---|---|
| Member 1 | feature/trueforge-integration |
| Member 2 | feature/vscode-ui |
| Member 3 | feature/context-engine |
| Member 4 | feature/mcp-diff-review |

See the Team Responsibilities section below for ownership.

## 7. Build and Run the Project

### Compile the extension

```bash
npm run compile
```

### Type-check

```bash
npm run typecheck
```

### Run lint

```bash
npm run lint
```

### Run unit tests

```bash
npx vitest run test/unit
```

### Open the project in VS Code

```bash
code .
```

Press **F5** to launch the Extension Development Host.

The current scaffold includes the `ForgePilot: Activate` command. The full agent chat and editing workflow is still under development.

For continuous compilation during development:

```bash
npm run watch
```

## 8. Optional: Local TrueForge Setup

Only required when working on or testing the live TrueForge integration.

Start the TrueForge server in a separate terminal:

```bash
OUTBOUND_URL_ALLOWED_HOSTS='["::1"]' \
NETWORK_POLICY_ENABLED=true \
npx --yes @truefoundry/trueforge@0.184.1 --port 8795
```

Keep this terminal running.

Verify the server from another terminal:

```bash
curl -g -I 'http://[::1]:8795'
```

Expected: an HTTP response from the TrueForge server.

Configure the project terminal:

```bash
export TRUEFORGE_BASE_URL="http://[::1]:8795"
```

The project uses IPv6 localhost for this local instance.

### Configure Gemini

1. Open the TrueForge web interface at http://[::1]:8795.
2. Navigate to Settings → Models.
3. Configure the Google Gemini provider.
4. Add your own Gemini API key.
5. Save the provider configuration.
6. Test a prompt through the TrueForge interface.

The configured model used by the current integration spike is:

```text
google-gemini/gemini-3-5-flash
```

**Security rules:**

- Never commit Gemini API keys.
- Never put Gemini API keys in agent/forgepilot.yaml.
- Never share private API keys in GitHub or this chat.
- Gemini credentials belong in TrueForge provider configuration.
- Do not disable TrueForge's outbound network security policy globally.

Each member who needs live Gemini testing should use an appropriately configured TrueForge instance or an authorized shared environment.

## 9. Running Tests

### Unit tests

```bash
npx vitest run test/unit
```

These tests do not require a live Gemini request.

### Full test suite

```bash
npm test
```

The full suite includes live TrueForge integration tests.

### TrueForge integration tests

Make sure TrueForge is running, then execute:

```bash
TRUEFORGE_BASE_URL="http://[::1]:8795" \
npx vitest run test/integration/trueforgeSpike.test.ts
```

**Important:** Live integration tests can make real model requests and consume Gemini API quota. Do not run them repeatedly without a reason.

Prefer mocked tests for routine development. Use live Gemini tests for controlled end-to-end verification.

## 10. Team Responsibilities

### Member 1 — TrueForge & Agent Integration Lead

**Branch:** `feature/trueforge-integration`

**Main responsibility:** Build and maintain the integration between ForgePilot and TrueForge.

Tasks:

- Verify and maintain TrueForge SDK integration.
- Manage TrueForge session creation and lifecycle.
- Implement agent execution and streaming.
- Implement cancellation and cleanup.
- Normalize TrueForge events.
- Handle authentication, quota, network and provider errors.
- Maintain the committed agent definition.
- Verify TrueForge MCP registration requirements.
- Maintain deterministic tests and controlled live integration tests.
- Document adapter contracts for other members.

**Main areas:**

```text
src/integration/
src/services/
agent/
test/integration/
docs/PROJECT_API_REGISTRY.md
```

**Expected deliverable:** A stable TrueForge adapter that other modules can use without independently implementing a model-provider or agent loop.

### Member 2 — VS Code Extension & UI Developer

**Branch:** `feature/vscode-ui`

**Main responsibility:** Build the user-facing VS Code experience.

Tasks:

- Implement extension activation and deactivation.
- Register ForgePilot commands.
- Build the chat interface.
- Implement prompt submission.
- Display streaming responses.
- Display agent and tool execution status.
- Implement cancellation controls.
- Implement inline editing entry points.
- Display useful error notifications.
- Connect the interface to Member 1's adapter.

**Main areas:**

```text
src/extension.ts
src/providers/
webview/
src/services/
```

**Expected deliverable:** A functional VS Code extension interface connected to the agent integration.

### Member 3 — Context Engineering Developer

**Branch:** `feature/context-engine`

**Main responsibility:** Help the agent understand the developer's workspace.

Tasks:

- Discover workspace files.
- Respect .gitignore and exclude generated or binary files.
- Implement workspace search.
- Extract relevant code symbols.
- Rank files and symbols based on the user's query.
- Build context bundles.
- Implement context-size estimation and token budgeting.
- Handle file-change invalidation.
- Provide context through the agreed interface.

**Main areas:**

```text
src/context/
test/unit/
```

**Expected deliverable:** A context engine capable of retrieving relevant repository information and supplying it to the agent.

### Member 4 — MCP, Diff Review & Testing Lead

**Branch:** `feature/mcp-diff-review`

**Main responsibility:** Implement safe workspace operations and change review.

Tasks:

- Build the ForgePilot workspace MCP server.
- Implement workspace file-reading tools.
- Implement workspace search tools.
- Validate workspace paths.
- Prevent path traversal and unauthorized access.
- Generate proposed file modifications.
- Generate file diffs and individual hunks.
- Implement hunk-level accept and reject.
- Implement safe application and undo.
- Add stale-file checks.
- Implement command approval.
- Add integration and safety tests.

**Main areas:**

```text
src/tools/
src/review/
src/utils/pathValidation.ts
test/
docs/
```

**Expected deliverable:** A secure MCP and diff-review layer that ensures agent changes are reviewed before being applied.

## 11. Git Workflow

### Before starting work

Check your current state:

```bash
git status
git branch --show-current
git remote -v
```

Fetch the latest remote branches:

```bash
git fetch origin
```

Switch to your assigned branch and update it.

If the local branch already exists:

```bash
git switch YOUR_BRANCH
git pull --ff-only origin YOUR_BRANCH
```

If it does not exist locally but exists on GitHub:

```bash
git switch --track -c YOUR_BRANCH origin/YOUR_BRANCH
```

Replace YOUR_BRANCH with your assigned branch name.

### During development

Check your changes:

```bash
git status
git diff
```

Run relevant tests:

```bash
npm run typecheck
npm run compile
npx vitest run test/unit
```

Commit your changes:

```bash
git add <specific-files>
git commit -m "feat: describe your implementation"
```

Push your branch:

```bash
git push origin YOUR_BRANCH
```

### Pull requests

- Open a pull request from your feature branch into main.
- Explain what you implemented.
- List modified files and tests.
- Include screenshots for UI changes.
- Mention known limitations.
- Request at least one teammate review.
- Merge only after review and successful checks.

**Rules:**

- Do not develop directly on main.
- Do not commit another member's work.
- Do not force-push shared branches.
- Do not overwrite shared contracts without coordination.
- Do not commit secrets, node_modules, dist or local environment files.

## 12. Shared Interface Coordination

Before implementing cross-module functionality, review:

```text
docs/PROJECT_API_REGISTRY.md
docs/TECHNICAL_DECISIONS.md
docs/PARALLEL_DEVELOPMENT.md
```

These documents describe the shared module contracts and ownership boundaries.

If a function signature or shared TypeScript type needs to change:

1. Discuss it with the affected member.
2. Agree on the new contract.
3. Update the API registry.
4. Update implementations and tests.
5. Include the change in the same pull request where practical.

Member 1 owns the TrueForge integration boundary. Other members must not independently create another model execution loop.

## 13. Competition Tasks

The project must demonstrate three important tasks.

### Task A — Inline Edit

Modify Flask's `get_debug_flag` function so that the values `off` and `n` are also treated as false, case-insensitively.

The docstring must list all false values.

### Task B — Autonomous Agent Mode

Build a Flask CLI command:

```text
flask config
```

It must print the loaded application's configuration as JSON and mask values for keys containing:

```text
SECRET
PASSWORD
TOKEN
KEY
```

The agent must discover the necessary files autonomously, update implementation, tests and documentation, and pass the required tests.

### Task C — Resilience

Demonstrate handling of invalid credentials or an unreachable model endpoint.

VS Code must remain responsive, and failed or unapproved generations must not leave workspace modifications.

See docs/PROJECT_CONTEXT.md for complete acceptance criteria.

## 14. Important Documentation

| File | Purpose |
|---|---|
| AGENTS.md | Instructions for AI coding assistants |
| MASTER_PROMPT.md | Main project development prompt |
| docs/PROJECT_CONTEXT.md | Project goals and competition requirements |
| docs/TEAM_WORKFLOW.md | Team ownership and Git workflow |
| docs/PROJECT_API_REGISTRY.md | Shared interfaces and implementation status |
| docs/PARALLEL_DEVELOPMENT.md | Parallel development instructions |
| docs/TECHNICAL_DECISIONS.md | Technical decisions and verified APIs |
| agent/forgepilot.yaml | ForgePilot agent definition |

## 15. Development Principles

1. Build small, testable modules.
2. Follow assigned file and branch ownership.
3. Prefer deterministic tests for routine development.
4. Use real Gemini requests only when necessary.
5. Do not trust unverified SDK APIs or undocumented assumptions.
6. Never write workspace files without explicit approval.
7. Keep the extension responsive during agent execution.
8. Document technical decisions and integration changes.
9. Review every pull request before merging.
10. Prioritize a working end-to-end product over unfinished abstractions.

---

**Team Beacon | ForgePilot | TrueFoundry Forge-a-thon 2026–27**
