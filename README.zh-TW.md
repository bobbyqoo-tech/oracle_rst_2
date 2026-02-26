# Mini RTS（瀏覽器 RTS 模擬）

目前版本：`v13.4`（`The first light / 初見之光`）

語言： [English](README.md) | [繁體中文](README.zh-TW.md)

這是一個可直接在瀏覽器執行的 RTS 模擬專案（不需要 npm / build）。

- 入口頁面：`index.html`
- 核心模組：`src/main.js`, `src/sim.js`, `src/world.js`, `src/pathfinding.js`, `src/state.js`, `src/constants.js`
- 專案交接脈絡：`PROJECT_CONTEXT_MERGED.md`

## 執行方式

- 使用 Live Server 或 GitHub Pages 開啟 `index.html`
- 專案使用 ES Modules（`<script type="module">`）

## 版本時間線（新 -> 舊）

### v13.4（視覺拋光階段，`The first light / 初見之光`）
- 新增受傷單位專用 HP Bar（小型、顯示於 sprite 上方）
- 新增 sprite 模式 foot-based Y depth sorting（建築/資源/動物/單位）
- 資產管線強化：manifest 集中映射 + 缺圖警告只顯示一次
- Fog 邊界柔化調整為較自然、較低強度的版本
- 修正 depth sorting 重構後資源在 fog 下誤顯示（資源應只在 `visible` 時繪製）

### v13.3（動物/建築工 Sprite + 地圖縮放）
- 野生動物加入 `wander / chase / return` 狀態 sprite（4 向靜態）
- 建築工加入 4 向靜態 sprite
- 新增只縮放 canvas 的地圖縮放功能（UI 保持可讀）

### v13.2（單位 Sprite，4 向靜態）
- `lumber` / `miner` / `hunter` / `scout` 改為 4 向靜態 sprite
- 朝向由既有移動/目標向量推導（不改 gameplay）

### v13.1（畫布 Fit UX）
- 畫布自動 fit 遊戲區，不需縮小整個瀏覽器 UI
- CSS 縮放下 hover/click 座標仍正確

### v13（The first light / 初見之光，24px Sprite 渲染管線）
- 視覺 tile 固定為 24px（格狀座標與邏輯不變）
- 新增 `assets/sprites/*` 與快取式 sprite 資產載入
- 地形 / 障礙 / 資源 / 建築改為 sprite 渲染
- 擴充渲染抽象層以支援 sprite/pixel 分派與 render hooks

### v12.1（採集壅塞 Hotfix）
- 樹木/礦石群生成改為更連續的 blob-like 叢集
- 伐木工/採礦工在壅塞時會重新換目標
- 若資源暫時沒有可站位格，工人會暫避並重試

### v12（渲染抽象層 Stage 1）
- 建立 `src/render/` 渲染抽象層
- 將原始渲染抽出到 `render_pixel.js`
- 新增 placeholder `render_sprite.js`（形狀版，無外部資產）
- `src/main.js` 加入單一 renderer mode 開關

### v11（QoL + 建築經濟 + 出生點偏移）
- 即時 hover 座標顯示（不需點擊）
- 建築成本與資源可負擔檢查
- 初始城鎮/單位出生點偏向右下

### v10（轉職系統 / Transplantation Guild）
- 新增 `transplantation` 轉職公會與轉職流程
- 新增轉職指令輸入與格式解析（`H#15`, `M#8`, `B#3`, `S#2`, `15`）
- 單位到公會工作後完成角色切換
- 修正 A：保留路徑 intent 狀態（`ToStorage` / `ToPark` / `ToTransplantation`）
- 修正 B：公會鄰格壅塞時會重試轉職路徑

### v9（穩定性 / 資源重繪 / 封存）
- 改善建築變更後的資源重繪行為
- 強化資源顯示與重繪穩定性
- 新增 `ver9/` 封存快照

### v8（建築工 + 倉庫建築 + 建造放置）
- 新增建築工角色
- 新增倉庫建築：`town_center`, `lumberyard`, `mining_site`, `granary`
- 新增建築放置 UI 與 storage/park ring 整合

### v7（獵人 / 野生動物 / HP逃跑 基礎版）
- 新增獵人角色基礎流程
- 新增野生動物 AI 基礎（wander/chase/leash/return）
- 新增 HP / 逃跑機制基礎版

### v6（倉庫交通改善）
- 倉庫附近 parking / 讓路行為
- 推擠 / soft-resolve 解堵邏輯

### v5（效能架構重寫）
- 分層渲染
- path queue 與每 tick 路徑預算
- frontier cache 改善

### v4（碰撞 / 採礦 / 迷霧 / 斥侯）
- 碰撞與佔位
- 採礦系統
- 戰爭迷霧
- 斥侯自動探索
- 手動開始流程

### v3（伐木 MVP v2：樹群 / 障礙 / 斜向）
- 樹木群聚生成
- 地形障礙
- 斜向移動與路徑改善

### v2（伐木 MVP：多工人）
- 多工人伐木模擬
- 工人/樹木數量參數化
- 擴充 UI 控制與狀態面板

### v1（伐木 MVP）
- 單一伐木工原型
- Canvas 渲染 + 基本 UI / 日誌
- 點擊樹木指令 + A* 路徑基礎

## 封存版本

版本封存資料夾包含：`ver8/`, `ver9/`, `ver10/`, `ver11/`, `ver12/`, `ver13/`

## 備註

- `PROJECT_CONTEXT_MERGED.md` 是目前階段與交接的主要來源
- `ver13/` 是 v13 系列封存快照，代號：`The first light / 初見之光`
