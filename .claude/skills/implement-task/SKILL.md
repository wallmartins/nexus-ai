---
name: implement-task
description: Implements the next eligible task from the board.
---

# Implement Task

## Goal

Select the next task with status `todo` and no pending dependencies.

## Rules

1. Read `.braddock/memory/tasks.json` and `.braddock/board/kanban.json`
2. Choose the next eligible task
3. Identify the owner
4. Use the appropriate agent:
   - backend-senior
   - frontend-senior
   - architect-specialist, if the task is structural
5. Always use the software-engineering (.claude/skills/software-engineering) skill for code principle, adapting for language culture and structure
6. For frontend tasks, use typescript (.claude/skills/typescript) skill and, if the project use react/next, use react (.claude/skills/react) skill, for all UI always consult DESYGN-SYSTEM.md to understand all concepts of design system.
7. Implement only what is needed for the task
8. Update:
   - .braddock/board/kanban.json
   - .braddock/memory/tasks.json
   - .braddock/memory/status.md

## Expected result

- task moves from `todo` to `review`
- implementation consistent with the spec
- observations recorded
