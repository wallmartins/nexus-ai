# Braddock AI Squad — Agent Guide

This repository implements a **virtual squad system** that transforms product ideas into implemented code through specialized AI agents. It is not a traditional codebase — it is an operational framework.

## Entry Points

| File | Purpose |
|------|---------|
| `.claude/CLAUDE.md` | Master instruction set for agents — read this first |
| `.braddock/PROMPT.md` | User-facing kickoff prompt — paste this to start |
| `.braddock/memory/vision.md` | Product idea source of truth |

## Activation

To initialize the squad, run the slash command:
```
/kickoff
```

## Execution Pipeline (Never Skip Steps)

```
/kickoff → /create-prd → /create-spec → /breakdown-work → /implement-task → /review-delivery
```

## Critical Rules

1. **Never implement before PRD and spec exist** — The pipeline must be followed in order
2. **Always record decisions** — Every business rule assumption goes in `.braddock/memory/decisions.md`
3. **Maintain traceability** — vision → PRD → spec → task → code must be verifiable
4. **Read first** — Before any action, read `.braddock/memory/vision.md`, `prd.md`, `spec.md`, `decisions.md`, and `.braddock/board/kanban.json`

## Artifact Locations

| Artifact | Path |
|----------|------|
| Vision | `.braddock/memory/vision.md` |
| PRD | `.braddock/memory/prd.md` |
| Architecture | `.braddock/memory/architecture.md` |
| Technical Spec | `.braddock/memory/spec.md` |
| Tasks | `.braddock/memory/tasks.json` |
| Decisions | `.braddock/memory/decisions.md` |
| Status | `.braddock/memory/status.md` |
| Kanban Board | `.braddock/board/kanban.json` |

## Agent Roster

| Agent | Responsibility | Skill |
|-------|---------------|-------|
| `pm` | PRD, scope, metrics | `/create-prd` |
| `tech-lead` | Technical direction, trade-offs | `/create-spec` |
| `architect-specialist` | System design, components | `/create-spec` |
| `ui-ux` | User journeys, interface | `/create-spec` |
| `planner` | Task breakdown, dependencies | `/breakdown-work` |
| `backend-senior` | Backend implementation | `/implement-task` |
| `frontend-senior` | Frontend implementation | `/implement-task` |
| `qa` | Validation, quality checks | `/review-delivery` |

## Task Selection Criteria

When running `/implement-task`, choose tasks that are:
- Status: `todo`
- Dependencies: all satisfied (none pending)
- Owner: matches the agent being invoked

## Board Structure

Kanban columns in `.braddock/board/kanban.json`:
- `backlog` → `todo` → `doing` → `review` → `done`

## Git Workflow (Per Task)

Each task implementation follows a branch-based Git workflow:

```
main (protected)
  │
  ├── feature/TASK-001-init-fastapi
  │     │
  │     └── implement, commit, push
  │     │
  ├── feature/TASK-003-docker-compose
  │     │
  │     └── implement, commit, push
  │
  └── merge via PR
```

### Rules

1. **Start from main:** Before any new task, checkout `main`, **always run `git pull origin main`**, then create branch
2. **Branch naming:** `feature/TASK-XXX-short-description`
3. **Commit messages:** Use conventional commits
   - `feat(TASK-XXX): description`
   - `fix(TASK-XXX): description`
   - `docs(TASK-XXX): description`
   - `refactor(TASK-XXX): description`
4. **One task per branch:** Never mix multiple tasks in one branch
5. **PR before merge:** Every task must go through Pull Request to `main`
6. **Update board on PR:** Move task to `review` when PR is opened
7. **Merge on approval:** Move task to `done` after merge

### implement-task Git Steps

When running `/implement-task`, the agent must:

1. `git checkout main`
2. `git pull origin main` **(always execute — mandatory)**
3. `git checkout -b feature/TASK-XXX-description`
4. **Implement the task**
5. **Self-Review (QA Gate before commit)** — Before staging changes, the agent must:
   - Read the task's definition of done and acceptance criteria
   - Read `.braddock/memory/tasks.json` to understand what is planned for future tasks
   - Review all modified/created files for gaps, risks, and spec deviations
   - Check for: missing imports, dead code, config contradictions, security issues, async/sync mismatches
   - **Context-aware gap analysis:** If a gap is found, verify whether it belongs to the current task or is planned for a future task (e.g., JWT auth in TASK-056, async DB in TASK-006, tests in TASK-080). Do not flag as a gap what is intentionally out of scope for the current task.
   - Fix all critical and high-priority gaps that are within the current task's scope
   - Only proceed to commit when the code passes self-review
6. `git add -A`
7. `git commit -m "feat(TASK-XXX): description"`
8. `git push -u origin feature/TASK-XXX-description`
9. Open PR to `main` with task summary
10. Update kanban: `doing` → `review`

> **Important:** The `git pull origin main` step is **mandatory** and must always be executed before creating a new feature branch. This ensures that the new branch is always based on the latest merged code from main.
>
> **Critical:** The **Self-Review** step (step 5) is mandatory. No code should be committed with known critical gaps. Common checks:
> - Does the implementation match the spec's acceptance criteria?
> - Are there contradictions with `.braddock/memory/decisions.md`?
> - Are there security concerns (hardcoded secrets, wildcard CORS, weak defaults)?
> - Are async/sync patterns consistent with FastAPI async requirements?
> - Are all new files properly included and old dead code removed?
> - Are exception handlers wired? Are configs aligned with decisions?
>
> If gaps are found during self-review, fix them before committing. If a gap cannot be fixed within the task scope, document it in the commit message body or PR description.

### Remote Repository

Set up GitHub remote:
```bash
git remote add origin https://github.com/YOUR_ORG/ai-knowledge-system.git
git push -u origin main
```

## Quality Gate

Before closing any step, validate:
- Consistency with previous artifacts
- Risks flagged
- Dependencies identified
- Open gaps documented

## Project Mode

Set via `.claude/settings.json`:
```json
{ "env": { "PROJECT_MODE": "braddock" } }
```
