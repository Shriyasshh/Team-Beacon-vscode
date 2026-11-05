# Team Workflow — Four-Person Team

## 1. Branch model
Use `main` as the stable integration branch. Create these feature branches from the latest `main`:

| Branch | Owner | Scope |
|---|---|---|
| `feature/trueforge-integration` | Member 1 | TrueForge adapter, agent definition, sessions, streaming, cancellation, resilience |
| `feature/vscode-ui` | Member 2 | Extension scaffold, commands, chat/inline-edit UI, VS Code integration |
| `feature/context-engine` | Member 3 | Workspace discovery, search, symbol/context retrieval, ranking, context budget |
| `feature/mcp-diff-review` | Member 4 | MCP tools, safe workspace tools, proposed writes, diff/hunk review, undo, tests/integration |

Shared integration/testing is coordinated through PRs into `main`; do not create a fifth permanent owner branch unless the team agrees.

## 2. Ownership and interfaces
- Member 1 is the owner of the TrueForge integration boundary. Other members must not independently implement a model loop.
- Member 2 owns VS Code lifecycle and user-facing interaction.
- Member 3 owns context retrieval APIs and their tests.
- Member 4 owns safe tool execution, diff review, and cross-feature acceptance tests.
- Agree on TypeScript interfaces before parallel implementation. Record them in `docs/TECHNICAL_DECISIONS.md`.
- If a change crosses ownership boundaries, open an issue or discuss it before editing another member's files.

## 3. Git workflow
Start by checking:
```bash
git status
git branch --show-current
git remote -v
```

Create each branch from updated `main`:
```bash
git switch main
git pull --ff-only origin main
git switch -c feature/trueforge-integration
git push -u origin feature/trueforge-integration
```
Repeat with the other exact branch names for their owners. Only one person should create/push a given branch initially; each member should use their own local clone and switch to their assigned branch.

Commit examples:
```bash
git add <specific-files>
git commit -m "feat: add TrueForge session adapter"
git push
```

Use small commits. Open a PR to `main`. Require at least one teammate review, passing tests, and a clean diff before merging. Do not force-push shared branches. Do not commit directly to `main` during feature development.

## 4. Integration cadence
- Sync at the start of each work session.
- Merge small PRs early; avoid waiting until the final day.
- Rebase/update a feature branch from `main` only with care; coordinate before rewriting shared history.
- After each merge, pull `main` and run the smoke tests.
- Keep `main` runnable. If a feature is incomplete, gate it behind a disabled command/feature flag rather than breaking activation.

## 5. Definition of done for PRs
Every PR should include:
- What changed and why.
- Files/modules changed.
- Tests run and exact results.
- Screenshots or short recording for UI behavior.
- Known limitations.
- Confirmation that secrets are not included.
- Confirmation that no unapproved workspace writes or destructive actions were introduced.

## 6. Daily coordination
Suggested rhythm:
- 15-minute sync: progress, next task, blockers.
- Development in focused ownership areas.
- 30–60-minute integration/review window.
- Update issues and `docs/TECHNICAL_DECISIONS.md`.
- End with a working-tree/branch status update.

## 7. Team task order
1. All members inspect the repository and agree on the project interfaces.
2. Member 2 creates the minimal VS Code extension scaffold.
3. Member 1 verifies TrueForge installation, version, docs, and creates the smallest working session/agent integration.
4. Member 4 defines tool and diff safety contracts with the other members.
5. Member 3 implements context retrieval against agreed interfaces.
6. Integrate one end-to-end vertical slice before adding advanced features.
7. Implement and test Tasks A, B, and C.
8. Record demo evidence and prepare submission artifacts.
