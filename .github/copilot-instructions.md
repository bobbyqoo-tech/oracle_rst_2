<!-- Copilot/AI agent instructions for Mini RTS simulation workspace -->
# Mini RTS — AI coding assistant guidance

This repo is a collection of single-file, browser-run Mini RTS demos (JS embedded in HTML). The codebase is small and client-only — there is no build system or server runtime. Use these notes to be immediately productive when editing, refactoring, or adding features.

## Big picture
- **Runtime**: plain HTML + inline JavaScript. Open `index.html` in a browser to run the simulation (root `index.html` is the latest v6). Older variants live in `ver1/`…`ver5/` and sample earlier implementations (see `Index.txt` and `readME.txt`).
- **Architecture**: each demo is a single-page simulation that manages: a tile grid (`Uint8Array`), resource lists (trees/rocks), units array (`units`, `workers`, `scouts`), and rendering layers (`baseLayer`, `fogLayer`, `canvas`). Key concerns implemented in-file: A* pathfinding, parking/dropoff rings, reservation arrays, incremental fog-of-war rendering.

## Key files to reference
- [index.html](index.html) — v6 production demo (entry point to change UI knobs and core algorithms).
- [Index.txt](Index.txt) — earlier, well-commented implementation showing simpler state machine and A*.
- [readME.txt](readME.txt) — short changelog across versions.
- `ver1/`…`ver5/` — historical variants for comparison and regression ideas.

## Project-specific patterns & conventions
- Single-file modules: logic, rendering, UI and constants are colocated. Prefer small, local edits over large restructuring unless also updating the UI controls.
- Typed arrays & stamps: pathfinding and occupancy use `Float32Array`, `Int32Array`, `Uint8Array` and stamp counters (`seenStamp`, `closedStamp`, `stampCounter`) to avoid memset costs — preserve this pattern if optimizing performance-sensitive code.
- Rings & reservations: storage uses a dropoff ring and a parking ring (`buildRings()`, `dropTiles`, `parkTiles`, `dropReservedBy`, `parkReservedBy`) — changes here affect many interactions (dropoff, parking, push/yield behavior).
- A* implementation: there are two styles in repo (compact heap-based in `index.html`, simpler map-based in `Index.txt`). Keep function names like `astar`, `initAstarArrays`, `canMoveDiag` to make cross-version diffs easier.
- In-page logging: simulation events write to a DOM `div#log`. Use it for quick behavioral debugging instead of console only.

## Developer workflows (how to build, run, debug)
- Run locally: open `index.html` in a modern browser (Chrome/Edge/Firefox). No npm/install required.
- Live-edit & test: edit the HTML file and refresh the page. Use browser devtools to inspect globals (e.g., `storage`, `units`, `grid`).
- Quick checks: adjust UI knobs (top-right panel) to reproduce scenarios (A* budget, tick Hz, parking radius). For deterministic tests, set constants at top of file instead of UI.
- Profiling hotspots: the A* heap and draw loops are primary hotspots. When optimizing, keep typed-array stamp technique and avoid per-tick allocations.

## Integration points & external dependencies
- None. The demos are self-contained and have no external CDN or package dependencies.

## Concrete examples to reference when coding
- Reserve logic: `reserveTileFromList(unitId, list, reservedBy)` in `index.html` — updates `reservedBy` arrays and is central for parking behavior.
- Pathfinding init: `initAstarArrays()` prepares `gScore`, `parent`, and stamp arrays to reuse across searches.
- Rendering layers: `resizeCanvases()`, `drawBaseAll()` and `drawFogAll()` demonstrate layered drawing (base layer + fog layer composited onto visible `canvas`).

## What to avoid / be careful about
- Don't assume modular imports — moving functions into modules requires updating inline data initializations and global references used by UI handlers.
- Changing tile coordinate math (indexing helpers `idx`, `xOf`, `yOf`) affects nearly every algorithm — change with thorough checks.

If anything in these notes looks wrong or you'd like more detail (example workflows, a suggested refactor, or unit-test harness), tell me which area to expand. — Copilot
