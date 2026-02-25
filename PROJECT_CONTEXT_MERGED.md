# PROJECT CONTEXT (MERGED) - Mini RTS

Last Updated: 2026-02-25  
Current Main Branch: `main`  
Current Version Label: `v12.1`

## 1) Project Overview

This is a browser-run RTS simulation (no npm/build step required).

- Entry page: `index.html`
- Main runtime modules: `src/main.js`, `src/sim.js`, `src/world.js`, `src/pathfinding.js`, `src/state.js`, `src/constants.js`
- Legacy backup page: `index_single.html`
- Version archive folders exist (`ver8`, `ver9`, `ver10`, `ver11`, `ver12`, etc.)

Live run mode:

- Open `index.html` directly via Live Server or GitHub Pages.
- ES Modules are used (`<script type="module">`).

## 2) Implemented Features (As Of v12.1)

### Core simulation

- Grid world with fog of war.
- Workers/hunters/scouts/builders.
- Wildlife AI (wander/chase/leash/return).
- HP, flee, heal loop.
- Pathfinding budget and incremental fog updates.

### Storage/building system

- `town_center` (initial, stores all resources).
- `lumberyard` for wood.
- `mining_site` for ore.
- `granary` for food.
- `transplantation` for reclass workflow.
- Workers drop to nearest valid building (typed storage or `town_center` fallback).
- Building placement UI by XY coordinates.

### Tech and age system

- Ages: `Ancient` -> `Classical` -> `Medieval`.
- Wood/mining tech trees with resource costs.

### Reclass system (v10 baseline retained)

- Reclass input supports `H#15`, `M#8`, `B#3`, `S#2`, or plain `15`.
- Unit must move to a built `transplantation`, then completes role switch after short work time.
- Retry logic handles temporary congestion around guild-adjacent tiles.

### New in v11

- Mouse hover coordinate display:
  - No click needed.
  - Current tile coordinate is shown live in side panel.
- Building costs:
  - Build types now have explicit resource costs.
  - Build command validates resources before placement.
  - Cost is deducted on successful placement request.
  - Build button/cost hint reflects affordability in real time.
- Spawn offset:
  - Initial `town_center` and starting unit cluster shifted to right-bottom area for future multi-faction expansion.

### New in v12 (Render Stage 1)

- Rendering abstraction layer introduced under `src/render/`.
- Existing pixel-style rendering extracted to `src/render/render_pixel.js`.
- Added alternate placeholder sprite-style renderer in `src/render/render_sprite.js` (no external assets).
- Renderer selection controlled by a single flag in `src/main.js` (`RENDER_MODE`).
- Game logic and data structures remain unchanged; grid coordinates remain authoritative.

### New in v12.1 (Gatherer Congestion Hotfix)

- Resource cluster generation (`tree` / `rock`) now grows as more connected blob-like groups instead of overly sparse scatter inside clusters.
- Lumber/miner workers now retarget to other resources if blocked too long or if no valid stand tile is available for the current target.
- Goal: reduce "workers stuck in one lump" behavior and unblock completed gatherers from leaving crowded resource fronts.

## 3) Recent Fixes (Critical)

### Fix A: Reclass path state overwritten

Problem:

- Path result handler converted unknown intents to `Move`, breaking `ToTransplantation`.

Fix:

- `src/pathfinding.js` and `ver10/pathfinding.js` preserve:
  - `ToStorage`
  - `ToPark`
  - `ToTransplantation`

Commit:

- `213e7d4` (`Fix reclass path state handling`)

### Fix B: Reclass congestion stall

Problem:

- If guild-adjacent tile was temporarily occupied, reclass command could stall.

Fix:

- `requestMoveToTransplantation` selects guild-adjacent walkable tile without requiring immediate empty occupancy.
- `tickReclass` retries after cooldown instead of dropping order.

Commit:

- `05710a5` (`Retry reclass pathing when guild tiles are congested`)

## 4) v12.1 File-Level Notes

### `index.html`

- Title and header updated to v12.1 text.
- Build dropdown labels now include cost hints.
- Added `#buildCost` and `#hoverCoordLabel`.
- Script source: `src/main.js?v=12.1`.

### `src/main.js`

- Added build cost table and build resource gating.
- Added live hover coordinate label update helper.
- Added `refreshBuildUI` and bound it to build type change + periodic info refresh.
- Added `RENDER_MODE` single switch and renderer initialization.
- Updated startup log text to v12.1.

### `src/sim.js`

- `updateInfo()` now calls `state.refreshBuildUI` so build affordability state stays synced with storage changes.
- `render()` now delegates to render abstraction (`src/render/renderer.js`).

### `src/render/renderer.js`

- Renderer dispatcher and mode setter (`pixel` / `sprite`).

### `src/render/render_pixel.js`

- Extracted original pixel renderer from `src/sim.js`.

### `src/render/render_sprite.js`

- Placeholder shape-based renderer (no external sprite assets).

### `src/world.js`

- Generation center moved to right-bottom offset (`~65%` map position with padding safeguards).
- `spawnClusteredPoints()` now grows connected cluster blobs for tree/rock placement.

### `src/sim.js` (v12.1 hotfix)

- Gatherers retarget blocked `tree`/`rock` targets after prolonged congestion.
- Gatherers also avoid/retry another target when a resource has no available stand tile.

### `src/state.js`

- Added `refreshBuildUI` callback slot.

## 5) Archive Status

- `ver11/` created and populated from current working version:
  - `ver11/src/*`
  - `ver11/index.html`
  - `ver11/index_single.html`
- `ver12/` currently also carries v12.1 hotfix snapshot updates (same folder, direct in-place patching).

## 6) Quick Verification Checklist (v12.1)

1. Generate map.
2. Move mouse over canvas and verify live coordinate updates in side panel (no click needed).
3. Start simulation.
4. Check build row cost hint (`#buildCost`) changes with selected building and current resources.
5. Try building when resources are insufficient and confirm blocked message.
6. Build `transplantation` after resources are enough.
7. Issue reclass command (e.g., `H#15` -> `miner`).
8. Confirm unit moves to guild, finishes reclass, and role behavior changes.
9. Confirm initial town/units appear right-bottom relative to map center.
10. Set `RENDER_MODE="pixel"` and confirm visuals match prior behavior.
11. Set `RENDER_MODE="sprite"` and confirm placeholder shape renderer displays units/resources/fog correctly.
12. Stress test with high lumber/miner counts and confirm blocked gatherers retarget instead of staying stuck on one resource.

## 7) Operational Notes For New Chat Continuation

- Ask next agent to read this file first.
- Default target file set for new features:
  - `src/*`
  - `index.html`
  - mirror to `ver12/*` when archive sync is required.
- Prefer non-destructive git operations.
- After each feature completion, update this file section-by-section.

## 8) Authorization / Command Workflow Notes

- Environment can interrupt commands via approval dialogs.
- If command appears stuck, re-run as a single simple command segment.
- Prefer already-approved command patterns.
- For shell content reads, `Get-Content` should be used directly.
