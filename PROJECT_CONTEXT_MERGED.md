# PROJECT CONTEXT (MERGED) - Mini RTS

Last Updated: 2026-02-25  
Current Main Branch: `main`  
Current Version Label: `v13.4`

## 1) Project Overview

This is a browser-run RTS simulation (no npm/build step required).

- Entry page: `index.html`
- Main runtime modules: `src/main.js`, `src/sim.js`, `src/world.js`, `src/pathfinding.js`, `src/state.js`, `src/constants.js`
- Legacy backup page: `index_single.html`
- Version archive folders exist (`ver8`, `ver9`, `ver10`, `ver11`, `ver12`, etc.)

Live run mode:

- Open `index.html` directly via Live Server or GitHub Pages.
- ES Modules are used (`<script type="module">`).

## 2) Implemented Features (As Of v13.4)

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

### New in v13 (Render Stage 2 - Real Sprite Pipeline, 24px)

- Fixed render tile size to `24px` (visual scale only; world coordinates remain grid-based).
- Added real sprite asset folder under `assets/sprites/*` and cached image loader (`src/render/assets.js`).
- Sprite renderer now uses `drawImage` with cached assets for:
  - terrain tiles
  - obstacle tiles
  - resource visuals (`tree`, `rock`, `meat`)
  - storage/building visuals (`town_center` and buildable storage types)
- Sprite anchor uses foot-on-ground alignment from tile center (drawn upward from logical tile center).
- Unit rendering remains placeholder shapes (no unit sprites yet).
- Missing/unloaded assets fall back to placeholder rendering without changing game logic.
- Static base/resource tile drawing now routes through render abstraction layer dispatch.

### New in v13.2 (Render Stage 3 - Unit Sprites, Static 4-way)

- Replaced unit placeholder rendering (for `lumber`, `miner`, `hunter`, `scout`) with sprite rendering in sprite mode.
- Direction selection is 4-way (`N/E/S/W`) and derived from existing path/target movement vectors (no animation/state logic changes).
- Unit sprites use foot-on-ground anchor and may exceed tile height vertically.
- `builder` sprite support was added in v13.3.
- Missing unit sprite assets fall back to existing placeholder unit rendering.

### New in v13.3 (Render Stage 4 - Animal/Builder Sprites + Map Zoom)

- Added sprite rendering for wildlife animals (static 4-way directional sprites by state: wander/chase/return).
- Added sprite rendering for `builder` units (static 4-way directional).
- Added map zoom control (UI slider + reset) that scales only the canvas display, not the side panels/UI.
- Hover/click coordinate mapping remains correct under canvas zoom scaling.

### New in v13.4 (Visual Polish Pass)

- Added minimal unit HP bars rendered above unit sprites only when HP is below max.
- Improved fog-of-war visuals with subtle edge softening at visible boundary (fog logic/data unchanged).
- Added foot-based Y depth sorting for sprite-mode dynamic drawables (buildings/resources/animals/units).
- Asset pipeline polish:
  - centralized manifest routing remains the source of truth for asset keys
  - missing/unresolved assets warn only once and fall back safely
- HP bars use a red missing-HP segment.
- Fixed a v13.4 regression where resources could render under fog when only explored.

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

### Fix C: Hidden resources rendered under fog after depth sorting (v13.4 regression)

Problem:

- Resource drawables were temporarily rendered for `explored` tiles instead of `visible` tiles.
- This caused visible artifacts under fog after the sprite depth-sorting refactor.

Fix:

- Sprite-mode resource drawables (`tree` / `rock` / `meat`) now render only when the tile is currently `visible`.

Commit:

- `2f39f63` (`Fix hidden resource rendering under fog`)

## 4) v13.4 File-Level Notes

### `index.html`

- Title and header updated to v13.4 text.
- Build dropdown labels now include cost hints.
- Added `#buildCost` and `#hoverCoordLabel`.
- Tile size UI is fixed to 24px.
- Added map zoom controls (`#zoomRange`, `#zoomReset`, `#zoomLabel`) for canvas-only zoom.
- Script source: `src/main.js?v=13.4`.

### `src/main.js`

- Added build cost table and build resource gating.
- Added live hover coordinate label update helper.
- Added `refreshBuildUI` and bound it to build type change + periodic info refresh.
- Added `RENDER_MODE` single switch and renderer initialization.
- Fixed `tilePx` generation parameter to 24 and disabled tile-size input editing.
- Triggers renderer asset preload and redraw after sprite assets finish loading.
- Added canvas fit/zoom display logic with correct tile picking under CSS scaling.
- Updated startup log text to v13.4.

### `src/sim.js`

- `updateInfo()` now calls `state.refreshBuildUI` so build affordability state stays synced with storage changes.
- `render()` now delegates to render abstraction (`src/render/renderer.js`).

### `src/render/renderer.js`

- Renderer dispatcher and mode setter (`pixel` / `sprite`).
- Expanded renderer abstraction to include base-layer/resource tile draw dispatch and asset priming hook.

### `src/render/render_pixel.js`

- Extracted original pixel renderer from `src/sim.js`.

### `src/render/render_sprite.js`

- Sprite renderer using cached `drawImage` assets with placeholder fallbacks.
- Includes 24px foot-anchor sprite placement for resources/buildings.
- Added static 4-way unit sprite rendering with direction inference from existing path/target vectors.
- Added wildlife + builder sprite rendering (4-way static; wildlife is state-based).
- Added foot-based Y depth sorting for sprite-mode drawables.
- Added minimal damaged-unit HP bars.

### `src/render/assets.js`

- Cached image loader/manifest helper for sprite rendering (no per-frame `Image()` creation).
- Missing/unresolved assets now warn only once.

### `assets/sprites/units/*`

- Added 4-way static unit sprite set for `lumber`, `miner`, `hunter`, `scout` (`*_n/e/s/w.svg`).
- Added 4-way static unit sprite set for `builder`.

### `assets/sprites/animals/*`

- Added 4-way static wildlife sprites for `wander`, `chase`, `return` visual states.

### `src/world.js`

- Generation center moved to right-bottom offset (`~65%` map position with padding safeguards).
- `spawnClusteredPoints()` now grows connected cluster blobs for tree/rock placement.
- Fog rendering visuals include subtle edge softening (logic/data unchanged).

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
- `ver13/` created as a v13-series snapshot (includes `src/`, `assets/`, `index.html`, `index_single.html`).

## 6) Quick Verification Checklist (v13.4)

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
11. Set `RENDER_MODE="sprite"` and confirm sprite rendering displays terrain/resources/buildings/units/animals correctly.
12. Stress test with high lumber/miner counts and confirm blocked gatherers retarget instead of staying stuck on one resource.
13. Confirm tile size is fixed at 24px and coordinate logic remains unchanged.
14. Temporarily rename one asset and confirm fallback visuals still render and warning appears only once.
15. Damage a unit and confirm only damaged units show HP bars with a red missing-HP segment.
16. Check overlap around trees/buildings/units and confirm foot-based depth sorting looks natural.
17. Confirm fog edge softening is subtle and resources are not visible under fog unless currently visible.

## 7) Operational Notes For New Chat Continuation

- Ask next agent to read this file first.
- Default target file set for new features:
  - `src/*`
  - `index.html`
  - `README.md`, `README.zh-TW.md`, `PROJECT_CONTEXT_MERGED.md` for release/handoff updates
  - mirror to `ver13/*` when archive sync is required.
- Prefer non-destructive git operations.
- After each feature completion, update this file section-by-section.

## 8) Authorization / Command Workflow Notes

- Environment can interrupt commands via approval dialogs.
- If command appears stuck, re-run as a single simple command segment.
- Prefer already-approved command patterns.
- For shell content reads, `Get-Content` should be used directly.

Asset Naming:
Final asset naming conventions are pending.
All asset keys must be routed through a manifest for easy remapping.
