# Mini RTS（瀏覽器 RTS 模擬）

目前版本：`v13.4`

語言： [English](README.md) | [繁體中文](README.zh-TW.md)

這是一個可直接在瀏覽器執行的 RTS 模擬專案（不需要 npm / build）。

- 入口頁面：`index.html`
- 核心模組：`src/main.js`, `src/sim.js`, `src/world.js`, `src/pathfinding.js`, `src/state.js`, `src/constants.js`
- 專案交接脈絡：`PROJECT_CONTEXT_MERGED.md`

## 執行方式

- 使用 Live Server 或 GitHub Pages 開啟 `index.html`
- 專案使用 ES Modules（`<script type="module">`）

## 版本摘要

### v1-v12.1（核心系統到渲染抽象）
- 建立工人/採礦工/獵人/斥侯/建築工、野生動物 AI、戰爭迷霧、倉庫/建築、轉職、科技/時代系統
- v12 建立渲染抽象層（`src/render/`），支援 pixel / sprite mode
- v12.1 修正採集壅塞與資源群生成行為

### v13（24px Sprite 渲染管線）
- 視覺 tile 固定為 24px（格狀座標與邏輯不變）
- 新增 `assets/sprites/*` 與快取式 sprite 資產載入
- 地形 / 障礙 / 資源 / 建築改為 sprite 渲染

### v13.1（畫布 Fit UX）
- 畫布自動 fit 遊戲區，不需縮小整個瀏覽器 UI
- CSS 縮放下 hover/click 座標仍正確

### v13.2（單位 Sprite，4 向靜態）
- `lumber` / `miner` / `hunter` / `scout` 改為 4 向靜態 sprite
- 朝向由既有移動/目標向量推導（不改 gameplay）

### v13.3（動物/建築工 Sprite + 地圖縮放）
- 野生動物加入 `wander/chase/return` 狀態 sprite（4 向）
- 建築工加入 4 向 sprite
- 新增 canvas-only 地圖縮放（UI 維持可讀）

### v13.4（視覺拋光階段）
- 受傷單位 HP Bar（小型、顯示於 sprite 上方）
- Sprite 模式 foot-based Y depth sorting
- 資產 manifest / warn-once 強化（缺圖只警告一次）
- Fog 邊界柔化調整為較自然的輕量版本
- 修正 depth sorting 後資源在 fog 下誤顯示問題

## 封存版本

版本封存資料夾包含：`ver8/`, `ver9/`, `ver10/`, `ver11/`, `ver12/`, `ver13/`

## 備註

- `PROJECT_CONTEXT_MERGED.md` 是目前階段與交接的主要來源
- `ver13/` 是 v13 系列（sprite pipeline + visual polish）的封存快照
