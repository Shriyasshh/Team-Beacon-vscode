# Parallel Development — Team Beacon

## Fork or clone?
The team repository is `https://github.com/Shriyasshh/Team-Beacon-vscode`. If this is your team's repository and all four members have collaborator write access, **do not fork it**. Add the other three members as GitHub collaborators; each member clones the same repository and works on their assigned branch. Fork only if the repository belongs to an external owner or a member cannot get write access.

## Start order
1. Finish master-prompt repository/TrueForge analysis.
2. Commit shared foundation files and `docs/PROJECT_API_REGISTRY.md` to `main`.
3. All four review the proposed contracts in the registry.
4. M1 verifies TrueForge APIs; M2 confirms extension scaffold/toolchain. Resolve blockers and agree shared TypeScript types.
5. Create/push the four feature branches from latest `main`.
6. Each member clones and checks out their assigned branch.
7. Start parallel implementation within ownership boundaries. Keep PRs small and update the registry in the same PR as code changes.
8. Integrate continuously into `main`; run smoke tests after every merge.

## Branch ownership
| Member | Branch | Owns |
|---|---|---|
| 1 | `feature/trueforge-integration` | TrueForge adapter, agent definition, sessions, streaming, cancellation, resilience |
| 2 | `feature/vscode-ui` | VS Code scaffold, activation, commands, chat UI, inline-edit UI |
| 3 | `feature/context-engine` | Workspace discovery, search, symbols, ranking, context budget |
| 4 | `feature/mcp-diff-review` | MCP tools, safe workspace operations, diffs, hunk review, undo, integration tests |

## Repository setup
Owner commits the shared foundation to main, then creates branches:
```bash
git switch main
git pull --ff-only origin main
git switch -c feature/trueforge-integration
git push -u origin feature/trueforge-integration
git switch main
git switch -c feature/vscode-ui
git push -u origin feature/vscode-ui
git switch main
git switch -c feature/context-engine
git push -u origin feature/context-engine
git switch main
git switch -c feature/mcp-diff-review
git push -u origin feature/mcp-diff-review
git switch main
git branch -a
```

Each member then runs:
```bash
git clone https://github.com/Shriyasshh/Team-Beacon-vscode.git
cd Team-Beacon-vscode
git switch feature/<their-assigned-branch>
```

## Coordination rules
- Registry is the shared API contract and progress ledger; actual source code remains authoritative if there is a mismatch. Resolve mismatch and update registry.
- Before changing a shared type/function signature, discuss with provider and consumers.
- Use small commits and PRs; no direct feature work on main; no force push to shared branches.
- Every PR states behavior, changed files, tests actually run, results, limitations and registry rows updated.
- Never overwrite another member's uncommitted work.
- First deliver a thin vertical slice: extension activation -> TrueForge-managed run -> read-only tool -> streamed UI response -> cancellation. Then build advanced features.
