# Mini RTS (Browser Simulation)

Current version: `v13.4` (`The first light`)

Languages: [English](README.md) | [繁體中文](README.zh-TW.md)

This is a browser-run RTS simulation (no npm/build step required).

- Entry page: `index.html`
- Main modules: `src/main.js`, `src/sim.js`, `src/world.js`, `src/pathfinding.js`, `src/state.js`, `src/constants.js`
- Project handoff context: `PROJECT_CONTEXT_MERGED.md`

## Run

- Open `index.html` with Live Server or GitHub Pages.
- ES Modules are used (`<script type="module">`).

## Version Timeline (Newest -> Oldest)

### v13.4 - Visual Polish Pass (`The first light / 初見之光`)
- Added minimal HP bars for damaged units only (above unit sprites)
- Added foot-based Y depth sorting for sprite-mode drawables (buildings/resources/animals/units)
- Asset pipeline polish: centralized manifest routing + warn-once behavior for missing assets
- Re-tuned fog edge softening to a subtle level
- Fix: hidden resource rendering under fog after depth-sorting refactor (resources must render only when `visible`)

### v13.3 - Animal/Builder Sprites + Map Zoom
- Added wildlife sprites (`wander` / `chase` / `return`, 4-way static)
- Added builder sprites (4-way static)
- Added canvas-only map zoom (UI stays readable)

### v13.2 - Unit Sprites (Static 4-way)
- Added 4-way static sprites for `lumber`, `miner`, `hunter`, `scout`
- Direction inferred from existing movement/target vectors (no gameplay changes)

### v13.1 - Canvas Fit UX
- Canvas auto-fits the game pane without shrinking the entire UI
- Hover/click tile coordinates remain correct under CSS scaling

### v13 - The first light (24px Sprite Rendering Pipeline)
- Fixed visual tile size to 24px (grid logic and coordinates unchanged)
- Added `assets/sprites/*` and cached sprite asset loading pipeline
- Terrain / obstacles / resources / buildings render via sprites
- Expanded render abstraction to support sprite/pixel dispatch and render hooks

### v12.1 - Gatherer Congestion Hotfix
- Tree/rock clusters generate as more connected blob-like groups
- Lumber/miner workers retarget when blocked too long
- Workers avoid resource targets that temporarily have no valid stand tile

### v12 - Render Abstraction (Stage 1)
- Introduced `src/render/` renderer abstraction layer
- Extracted original renderer into `render_pixel.js`
- Added placeholder `render_sprite.js` (shape-based, no external sprite assets)
- Added single renderer mode switch in `src/main.js`

### v11 - QoL + Build Economy + Spawn Offset
- Live hover coordinate display (no click required)
- Building costs + affordability gating in UI and build command flow
- Initial town/unit spawn shifted to right-bottom area for future expansion

### v10 - Reclass System (Transplantation Guild)
- Added `transplantation` building and reclass workflow
- Added reclass command input / parsing (`H#15`, `M#8`, `B#3`, `S#2`, `15`)
- Unit role switching after guild work time
- Fix A: preserved path intent states (`ToStorage` / `ToPark` / `ToTransplantation`)
- Fix B: retried reclass pathing when guild-adjacent tiles were congested

### v9 - Stability / Resource Redraw / Archive
- Improved resource redraw behavior around building changes
- Stabilized resource visibility/redraw edge cases
- Added `ver9/` archive snapshot

### v8 - Builders + Storage Buildings + Placement
- Added builder role
- Added storage buildings: `town_center`, `lumberyard`, `mining_site`, `granary`
- Added building placement UI and storage/park ring integration

### v7 - Hunters / Wildlife / HP-Flee (Base)
- Added hunter role baseline
- Added wildlife AI baseline (wander/chase/leash/return)
- Added HP/flee mechanics baseline

### v6 - Storage Traffic Improvements
- Parking / yield behavior near storage
- Push / soft-resolve anti-jam logic

### v5 - Performance Rewrite
- Layered rendering pipeline
- Path queue + per-tick pathfinding budget
- Frontier cache improvements

### v4 - Collision / Mining / Fog / Scout
- Collision/occupancy
- Mining system
- Fog of war
- Scout auto exploration
- Manual start flow

### v3 - Lumber MVP v2 (Clusters / Obstacles / Diagonals)
- Tree clusters
- Obstacles
- Diagonal movement/pathing improvements

### v2 - Lumber MVP (Multi Workers)
- Multi-worker lumber simulation
- Parameterized worker/tree counts
- Expanded UI controls and status panel

### v1 - Lumber MVP
- Single worker lumber prototype
- Canvas rendering + basic UI/log
- Tree click command + A* pathfinding baseline

## Archives

Version archives are stored in folders like `ver8/`, `ver9/`, `ver10/`, `ver11/`, `ver12/`, `ver13/`.

## Notes

- `PROJECT_CONTEXT_MERGED.md` is the main source of truth for current state and handoff details.
- `ver13/` is the v13-series snapshot archive, codename: `The first light / 初見之光`.
