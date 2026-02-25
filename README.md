# Mini RTS (Browser Simulation)

Current version: `v12`

This is a browser-run RTS simulation (no npm/build step required).

- Entry page: `index.html`
- Main modules: `src/main.js`, `src/sim.js`, `src/world.js`, `src/pathfinding.js`, `src/state.js`, `src/constants.js`
- Project handoff context: `PROJECT_CONTEXT_MERGED.md`

## Run

- Open `index.html` with Live Server or GitHub Pages.
- ES Modules are used (`<script type="module">`).

## Version Changelog (v1-v12)

### v1 - Lumber MVP
- Single worker lumber prototype
- Canvas rendering + basic UI/log
- Tree click command + A* pathfinding baseline

### v2 - Lumber MVP (Multi Workers)
- Multi-worker lumber simulation
- Parameterized worker/tree counts
- Expanded UI controls and status panel

### v3 - Lumber MVP v2 (Clusters / Obstacles / Diagonals)
- Tree clusters
- Obstacles
- Diagonal movement/pathing improvements

### v4 - Collision / Mining / Fog / Scout
- Collision/occupancy
- Mining system
- Fog of war
- Scout auto exploration
- Manual start flow

### v5 - Performance Rewrite
- Layered rendering
- Path queue / budget processing
- Frontier cache improvements

### v6 - Storage Traffic Improvements
- Parking / yield near storage
- Push / soft-resolve anti-jam logic

### v7 - Hunters / Wildlife / HP-Flee (base)
- Hunter role
- Wildlife AI
- HP / flee mechanics (early stage)

### v8 - Builders + Storage Buildings + Placement
- Builder role
- Storage buildings (`town_center`, `lumberyard`, `mining_site`, `granary`)
- Building placement UI and ring logic integration

### v9 - Stability / Resource Redraw / Archive
- Resource redraw fixes after building
- Stable resource rendering improvements
- `ver9/` archive bundle

### v10 - Reclass (Transplantation Guild)
- Job-change system via `transplantation`
- Reclass command UI and role switching flow
- Path state preservation + congestion retry fixes

### v11 - QoL + Build Economy + Spawn Offset
- Hover coordinate display (no click needed)
- Building costs + affordability gating
- Right-bottom spawn offset for future multi-faction expansion

### v12 - Render Abstraction (Stage 1)
- `src/render/` renderer abstraction layer
- `render_pixel.js` extracted from existing rendering
- `render_sprite.js` placeholder shape renderer (no external assets)
- Single renderer switch in `src/main.js`
- Game logic/data structures unchanged

## Archives

Version archives are stored in folders like `ver8/`, `ver9/`, `ver10/`, `ver11/`, `ver12/`.

## Notes

- Early version summaries (v1-v7) are reconstructed from archived files and titles.
- `PROJECT_CONTEXT_MERGED.md` is the main source of truth for current state and handoff details.

