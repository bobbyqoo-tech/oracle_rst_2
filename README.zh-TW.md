# Mini RTS（瀏覽器模擬）

目前版本：`v12.1`

語言： [English](README.md) | [繁體中文](README.zh-TW.md)

這是一個可直接在瀏覽器執行的 RTS 模擬專案（不需要 npm / build step）。

- 入口頁面：`index.html`
- 主要模組：`src/main.js`, `src/sim.js`, `src/world.js`, `src/pathfinding.js`, `src/state.js`, `src/constants.js`
- 專案交接文件：`PROJECT_CONTEXT_MERGED.md`

## 執行方式

- 使用 Live Server 開啟 `index.html`，或部署到 GitHub Pages。
- 專案使用 ES Modules（`<script type="module">`）。

## 版本變更紀錄（v1-v12.1）

### v1 - Lumber MVP（伐木最小可行版）
- 單一伐木工原型
- Canvas 渲染 + 基本 UI / 訊息紀錄
- 點擊樹木下指令 + A* 路徑尋找基礎

### v2 - Lumber MVP（多伐木工）
- 多伐木工模擬
- 可調整伐木工 / 樹木數量
- 擴充控制面板與狀態資訊

### v3 - Lumber MVP v2（樹群 / 障礙 / 斜向移動）
- 樹木群聚生成
- 地形障礙
- 斜向移動 / 路徑行為改善

### v4 - 碰撞 / 採礦 / 戰爭迷霧 / 斥侯
- 單位碰撞 / 佔位系統
- 採礦流程
- 戰爭迷霧
- 斥侯自動探索
- 手動開始流程

### v5 - 效能架構重寫
- 分層渲染
- 路徑佇列 / 預算式處理
- frontier 快取改善

### v6 - 倉庫交通改善
- 倉庫前 parking / 讓路
- 推擠 / 軟解堵邏輯

### v7 - 獵人 / 野生動物 / 血量逃跑（基礎版）
- 獵人職業
- 野生動物 AI
- HP / 逃跑機制（早期版本）

### v8 - 建築工 + 倉儲建築 + 建造放置
- 建築工職業
- 倉儲建築系統（`town_center`, `lumberyard`, `mining_site`, `granary`）
- 建築座標放置 UI 與 ring 邏輯整合

### v9 - 穩定性 / 資源重繪 / 封存
- 建造後資源重繪修正
- 已探索資源顯示穩定性改善
- `ver9/` 封存

### v10 - 轉職系統（Transplantation Guild）
- 透過 `transplantation` 建築進行轉職
- 轉職指令 UI 與角色切換流程
- 關鍵修正：
  - 保留 `ToTransplantation` 路徑狀態
  - 公會周邊壅塞時可重試轉職路徑

### v11 - 操作優化 + 建築成本 + 出生偏移
- 滑鼠懸停即時座標顯示（不用點擊）
- 建築成本 / 資源不足阻擋
- 初始城鎮中心與單位出生點偏右下（為多勢力預留）

### v12 - 渲染抽象層（美術渲染第一階段）
- 新增 `src/render/` 渲染抽象層
- `render_pixel.js` 抽出既有像素渲染
- `render_sprite.js` 新增 placeholder 形狀渲染（不使用外部素材）
- `src/main.js` 單一旗標切換 renderer
- 遊戲邏輯 / 資料結構不變

### v12.1 - 採集壅塞 Hotfix
- 樹木 / 礦物生成改為更黏連的群聚 blob 形態
- 伐木工 / 礦工在資源點壅塞卡住過久時會改找其他資源
- 當目標資源暫時沒有可站位採集格時，也會暫避並重選目標
- 以 v12 為基底直接熱修（仍使用 `ver12/` 封存線）

## 封存版本

各版本封存在 `ver8/`, `ver9/`, `ver10/`, `ver11/`, `ver12/` 等資料夾。

## 備註

- 早期版本摘要（`v1-v7`）是依封存檔案與標題重建，可能不如後期版本精確。
- 目前專案狀態與交接資訊以 `PROJECT_CONTEXT_MERGED.md` 為準。
