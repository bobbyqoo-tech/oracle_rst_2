# Mini RTS (Browser Simulation)

Current version: `v13.4`

Languages: [English](README.md) | [繁體中文](README.zh-TW.md)

This is a browser-run RTS simulation (no npm/build step required).

- Entry page: `index.html`
- Main modules: `src/main.js`, `src/sim.js`, `src/world.js`, `src/pathfinding.js`, `src/state.js`, `src/constants.js`
- Project handoff context: `PROJECT_CONTEXT_MERGED.md`

## Run

- Open `index.html` with Live Server or GitHub Pages.
- ES Modules are used (`<script type="module">`).

## Version Summary

### v1-v12.1 (Core systems to render abstraction)
- Workers/miners/hunters/scouts/builders, wildlife AI, fog, pathfinding, storage/buildings, reclass, tech/age system
- v12 introduced renderer abstraction (`src/render/`) with pixel/sprite modes
- v12.1 fixed gatherer congestion and clustered resource generation behavior

### v13 (24px Sprite Rendering Pipeline)
- Fixed visual tile size to 24px (grid logic unchanged)
- Added `assets/sprites/*` and cached sprite asset loader
- Terrain / obstacles / resources / buildings render via sprites

### v13.1 (Canvas Fit UX)
- Canvas auto-fits the game pane without shrinking the whole UI
- Hover/click tile coordinates stay correct under CSS scaling

### v13.2 (Unit Sprites, Static 4-way)
- Added 4-way static sprites for `lumber`, `miner`, `hunter`, `scout`
- Direction inferred from existing movement/target vectors (no gameplay changes)

### v13.3 (Animal/Builder Sprites + Map Zoom)
- Added wildlife sprites (`wander/chase/return`, 4-way)
- Added builder sprites (4-way)
- Added canvas-only map zoom (UI remains readable)

### v13.4 (Visual Polish Pass)
- Damaged-unit HP bars (minimal, above sprite)
- Foot-based Y depth sorting for sprite-mode drawables
- Asset manifest / warn-once polish for missing assets
- Fog edge softening tuned to subtle levels
- Fixed hidden resource rendering under fog after depth-sorting refactor

## Archives

Version archives are stored in folders like `ver8/`, `ver9/`, `ver10/`, `ver11/`, `ver12/`, `ver13/`.

## Notes

- `PROJECT_CONTEXT_MERGED.md` is the main source of truth for current state and handoff details.
- `ver13/` is the v13-series snapshot archive (sprite pipeline + visual polish stage).
