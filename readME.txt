Mini RTS - Version Change Log (Recovered)
=========================================

Last Updated: 2026-02-25
Current Version: v12

This file was rebuilt after a local content loss / encoding corruption incident.
Recent versions (v8-v12) are based on git history + project context and are high confidence.
Early versions (v1-v7) are reconstructed from archived `ver*/index.html` titles and existing files.

Current Runtime
---------------
- Entry: `index.html`
- Main modules: `src/main.js`, `src/sim.js`, `src/world.js`, `src/pathfinding.js`, `src/state.js`, `src/constants.js`
- Project context: `PROJECT_CONTEXT_MERGED.md`

Version History
---------------

v1 - Lumber MVP
- Single worker lumber prototype
- Canvas rendering + basic UI panel/log
- Manual click target selection for trees
- A* pathfinding baseline

v2 - Lumber MVP (Multi Workers)
- Multiple lumber workers
- Auto-run harvesting toward map clear
- Parameter inputs for worker/tree counts
- Expanded control panel / status UI

v3 - Lumber MVP v2 (Clusters / Obstacles / Diagonals)
- Tree clustering
- Terrain obstacles
- Diagonal movement support
- Improved pathing behavior on richer maps

v4 - Collision / Mining / Fog / Scout / Start Button
- Unit collision / occupancy handling
- Mining resource workflow added
- Fog of war added
- Scout unit auto exploration added
- Manual start flow introduced

v5 - Performance Rewrite
- Layered rendering approach
- Path queue / budget-oriented pathfinding processing
- Frontier/exploration caching improvements
- Focus on simulation scalability and stability

v6 - Storage Traffic Improvements
- Parking / yield behavior near storage
- Push / soft-resolve anti-jam logic
- Better congestion handling while preserving performance structure

v7 - Hunters / Wildlife / HP-Flee (base)
- Hunter role added
- Wildlife AI added (wander/chase style baseline)
- HP and flee-related systems introduced (early stage)

v8 - Builders + Storage Buildings + Placement
- Builder role and build workflow added
- Storage building system introduced
  - `town_center`
  - `lumberyard`
  - `mining_site`
  - `granary`
- Building placement by XY input
- Ring logic (`buildRings`) integrated/fixed

v9 - Stability / Visual Sync / Archive
- Resource redraw fix after building placement
- Stable discovered resource rendering improvements
- UI/title updates and cache-busting adjustments
- `ver9/` archive bundle added

v10 - Job Change (Transplantation Guild)
- Reclass/job-change system introduced
- New building: `transplantation`
- Reclass command UI:
  - `reclassWho`
  - `reclassTo`
  - `reclassBtn`
- Reclass flow: move to guild -> work time -> role switch
- Critical fixes:
  - Preserve `ToTransplantation` path state
  - Retry reclass pathing when guild-adjacent tiles are congested
- `ver10/` archive added

v11 - QoL + Build Economy + Spawn Offset
- Mouse hover coordinate display (no click required)
- Building costs added with affordability check and deduction
- Build UI cost hint / disabled state sync
- Initial town center + unit spawn cluster shifted to right-bottom area
- `ver11/` archive added

v12 - Render Abstraction (Stage 1 Art Rendering)
- Rendering abstraction layer extracted to `src/render/`
- Pixel renderer extracted to `src/render/render_pixel.js`
- Placeholder sprite-style renderer added in `src/render/render_sprite.js` (no external assets)
- Single renderer mode switch via flag in `src/main.js`
- Game logic and data structures unchanged (grid coordinates remain authoritative)
- `ver12/` archive added

Notes
-----
- Some archive folder labels/titles in old versions may not perfectly match the folder name due to historical copy/bundle steps.
- Use `PROJECT_CONTEXT_MERGED.md` as the authoritative handoff document for current development.

