# AGENTS.md

## Purpose

This file defines the default collaboration style and repository-specific rules for coding agents working in this repo.
Agents should follow this file first, then read `PROJECT_CONTEXT_MERGED.md` before making changes.

## Default Startup Workflow

1. Read `PROJECT_CONTEXT_MERGED.md` first.
2. Inspect only the files relevant to the task.
3. If the task is substantial or risky, provide a short implementation plan first and wait for approval.
4. If the task is small and low-risk, implement directly.
5. After completing a feature/fix, update `PROJECT_CONTEXT_MERGED.md` as needed.

## Collaboration Style

- Be pragmatic and concise.
- Prioritize direct execution over long discussion.
- Use English for technical notes and code changes.
- Short progress updates are preferred while working.
- Challenge weak assumptions when needed, but stay practical.

## Shell / File Access Policy

- Shell commands for reading and writing files are allowed.
- Allowed file types to read/write: `.md`, `.js`, `.json`, `.html`, `.txt`, and project asset files (e.g. `.svg`) when part of rendering/content work.
- Stay within this repository only.
- Do not install packages or dependencies (`npm`, `pip`, `apt`, `brew`, etc.).
- Do not use network/download commands (`curl`, `wget`, `Invoke-WebRequest`, etc.).
- Do not delete files or directories unless the user explicitly approves first.

## Git Policy

- `git add`, `git commit`, and `git push` are allowed.
- Keep commit messages short and descriptive.
- Do not use `git reset`, `git rebase`, `git clean`, or force push.
- Do not rewrite history unless explicitly requested.

## Planning / Approval Rules

Ask for approval before implementation when:

- The user explicitly asks for a plan first.
- The change is a large structural refactor.
- The change affects architecture across many files.
- The change may impact rendering pipeline behavior broadly and requires tradeoff decisions.

Directly implement (without stopping for approval) when:

- The user asks for a contained bug fix or polish change.
- The request is a clear continuation of the current approved direction.
- The task is documentation updates, version archival, or small UI/render tweaks.

## Safety / Scope Rules

- Do not modify simulation logic, AI, combat, pathfinding, or state machines unless the user explicitly asks.
- For rendering tasks, prefer changes inside the rendering layer and keep game logic unchanged.
- Preserve existing coordinate systems and data structures unless explicitly approved.
- Keep rendering deterministic and performant.

## Rendering-Specific Conventions (Current Project)

- Sprite/assets should be routed through a centralized manifest (do not hardcode file names in logic paths).
- Missing assets must fall back safely.
- Prefer cached asset loading (no per-frame `Image()` creation).
- Keep canvas interactions (hover/click) correct under CSS scaling / zoom.

## Documentation / Handoff Expectations

When a milestone is completed:

- Update `PROJECT_CONTEXT_MERGED.md` with version changes, file-level notes, and verification checklist items.
- Update `README.md` and `README.zh-TW.md` if user-facing project capabilities changed materially.
- If the user requests a version archive, create `verXX/` snapshot and note it in `PROJECT_CONTEXT_MERGED.md`.

## Preferred Next-Chat Behavior

- Assume the user wants continuity with the current repo state.
- Start by reading `PROJECT_CONTEXT_MERGED.md`.
- Do not ask the user to repeat authorization/policies if this file already covers them.
- Still respect environment-level approval prompts when they appear.
