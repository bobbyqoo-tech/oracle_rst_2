# Mini RTS Simulation Demo

## Architecture
- Single file HTML project
- All logic is inside index.html
- No module splitting allowed
- Performance budget system must be preserved
- Simulation tick based

## World
- 2D grid map
- Fog of war
- Resource clusters

## Unit Types
### Worker
- Gather wood
- Gather ore
- Flee when HP < 20%

### Hunter
- Hunt animals
- Gather meat
- Same flee behaviour as workers

### Scout
- Explore fog using frontier sampling

## Animal AI
- Wander around home radius
- Chase attacker
- Stop chase beyond leash radius
- Drop meat resource when killed

## Combat Rules
- All units attack = 1 damage per second
- Units have HP system

## Storage Logic
- Uses dropoff ring
- Uses parking system
- Uses yield / push system

## Performance Rules
- Must use pathfinding budget
- Must use fog incremental update
- Avoid full map scanning
- Avoid per unit BFS

## Development Goal
- This is a demo project
- Maintain visual clarity over realism
- Maintain stability over feature complexity

Language Rule:
User instructions may be in Traditional Chinese.
Technical keywords remain in English.

---

# Agent.md (Merged Reference)

## 0. 注意事項 (Standard Operating Procedures)
- 語言規範：UI 顯示與註解使用 繁體中文 (Traditional Chinese) 與 英文 (English)。
- 命名與在地化：所有顯示文字必須使用 LocalizationID（例如 STR_UNIT_KING），並透過 LangConfig.json 進行映射。
- 開發步調：採迭代式開發。每一步僅針對特定模組進行實作，避免觸發 Token Limit。
- 版本控制：每次完成階段性開發，Agent 必須更新 Dev_Log.txt。
- Unity 預備：C# 邏輯層需盡量與 System 庫解耦，以便未來移植至 Unity 的 MonoBehaviour 或 ECS 體系。

## 1. 遊戲理念 (Game Design Document - Brief)
- 遊戲名稱：代理人戰爭 (Proxy War)
- 核心玩法：玩家扮演幕後統治者，透過「大臣」系統間接下達指令，處理科技發展、資源管理與戰爭。
- 勝負條件：弒君模式 (Regicide) - 擊殺敵方國王。
- 特色：指令傳遞有延遲與風險（傳令兵機制），且玩家需透過「咒語/自然語言」與大臣互動來執行複雜決策。

## 2. 資料夾結構 (Directory Structure)
這是為 C# 後端與 Web 前端設計的混合架構：

```
ProxyWar_Demo/
├── Backend/                    # C# Web API (Logic & State)
│   ├── ProxyWar.Core/          # 核心邏輯 (未來可移植至 Unity)
│   │   ├── Models/             # 單位、建築、資源實體
│   │   ├── Systems/            # 科技樹、地圖管理、FOW邏輯
│   │   └── Interfaces/         # 定義指令接口
│   ├── ProxyWar.API/           # Web API 控制器 (處理前端與 Agent 通訊)
│   └── ProxyWar.Localization/  # STR_ID 對照表 (JSON)
├── Frontend/                   # HTML/JS 展示層
│   ├── index.html              # 主頁面 (UI & Canvas)
│   ├── js/
│   │   ├── engine.js           # 渲染迴圈與時間控制
│   │   ├── renderer.js         # Canvas 2D 繪圖
│   │   └── input_handler.js    # 咒語與命令發送
│   └── css/
│       └── game_ui.css         # 介面佈局
├── Data/                       # 設定檔
│   ├── Maps/                   # 地圖 JSON (100x100 Grid)
│   ├── TechTree.json           # 科技樹節點定義
│   └── Localization.json       # 語系對照表
└── Dev_Log.txt                 # 開發進度追蹤
```