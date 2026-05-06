# 项目文件树 — 奇正相生-战斗模拟器

```
qi-zheng-interplay/
├── index.html                         # HTML 入口，挂载 #app，引入 /src/main.ts
├── package.json                       # 项目元信息与依赖声明（Vue3 + Pinia + Electron）
├── tsconfig.json                      # TypeScript 编译配置（strict, ESNext, Bundler）
├── vite.config.ts                     # Vite 构建配置（Vue 插件 + @/ 别名）
├── env.d.ts                           # Vite/Vue SFC 类型声明
├── file-tree.md                       # 本文件 — 项目文件树与各文件职责说明
├── electron/
│   └── main.cjs                       # Electron 主进程：创建 BrowserWindow，dev/prod 模式切换
└── src/
    ├── main.ts                        # 应用入口：创建 Pinia + Vue App，引入 4 个 CSS 文件
    ├── app/
    │   └── App.vue                    # 根布局组件：三栏结构（地图+工具栏 | 日志面板）
    ├── domain/                        # 纯数据与几何层（5 文件，无框架依赖）
    │   ├── types.ts                   # 全部 TS 类型定义（GameMode, RuntimeUnit, ShotTrail, LogEntry 等）
    │   ├── constants.ts               # 画布尺寸、网格比例、移动速度、弹道衰减等基础常量
    │   ├── units.ts                   # 单位模板数据（蓝方圆/红方菱）+ RuntimeUnit 工厂函数
    │   ├── geometry.ts                # 纯几何计算：线段相交、矩形遮挡判定、灌木距离判定
    │   └── terrain.ts                 # 关卡地形数据：掩体矩形数组 + 灌木圆形数组
    ├── game/                          # 游戏逻辑层（5 文件，纯函数 + composable 模式）
    │   ├── movement.ts                # 路径推进：每帧沿路径移动单位，更新位置与朝向
    │   ├── combat.ts                  # 射击与命中判定：tryFire, 冷却, 伤害计算, 掩体/灌木修正
    │   ├── path-editing.ts            # 路径编辑全流程：begin, extend, smooth, finalize, undo, redo
    │   ├── timeline.ts                # 时间轴管理：快照 clone/restore, commit, persistBaseline
    │   └── readability.ts             # 可读性计算：火力/视野扇区常量, normalizeAngle, 命中估算
    ├── stores/                        # Pinia 状态管理层（5 文件）
    │   ├── gameStore.ts               # 核心 Store：声明所有 reactive state，组装 composable 并导出
    │   ├── derived.ts                 # 派生状态：readabilityHints + renderSnapshot computed
    │   ├── execution.ts               # 执行控制：tick, runSimulationTick, start/pause/resume
    │   ├── session.ts                 # 会话管理：initGame, selectPlannerByPoint
    │   └── playback.ts                # 回放控制：stepBackward, stepForward, seekTimeline
    ├── rendering/                     # Canvas 渲染层（5 文件，纯函数，接收只读快照）
    │   ├── tacticalCanvasRenderer.ts  # 渲染协调器：clearRect + 依次调用各子渲染函数
    │   ├── drawTerrain.ts             # 地形渲染：网格线 + 比例尺 + 掩体矩形 + 灌木丛
    │   ├── drawSectors.ts             # 扇区渲染：火力扇区（实线半透明）+ 视野扇区（虚线）
    │   ├── drawPathsShots.ts          # 路径与可读性渲染：规划路径线/箭头 + 交火可读性连线
    │   └── drawUnits.ts               # 单位渲染：圆形/菱形 + 血条 + 方向指示器 + 弹道轨迹
    ├── components/                    # Vue 组件层
    │   ├── TacticalMapCanvas.vue      # Canvas 交互组件：模板 + 事件绑定（~50行）
    │   ├── GameToolbar.vue            # 底部播放器栏：播放/暂停/步进/撤销/重做/滑条/重置
    │   ├── BattleLogPanel.vue         # 右侧战斗日志面板：实时滚动显示 T+Xs 格式事件
    │   └── canvas/                    # Canvas 输入/动画子模块（3 文件）
    │       ├── useCanvasInput.ts      # 鼠标输入处理：坐标转换 + mousedown/move/up/context/dblclick
    │       ├── useCanvasTouch.ts      # 触摸输入处理：touchstart/move/end + 双击检测
    │       └── useAnimationLoop.ts    # requestAnimationFrame 循环：tick + renderTacticalScene
    ├── styles/                        # CSS 样式（4 文件，按视觉区域拆分）
    │   ├── layout.css                 # html/body/app/header/tactical-layout 布局样式
    │   ├── controls.css               # 播放器栏/按钮/滑条/active/disabled 状态样式
    │   ├── battlefield.css            # Canvas 地图/右键菜单样式
    │   └── log-panel.css              # 日志面板/头部/内容/条目/Tone 颜色样式
    └── utils/
        └── timeFormat.ts              # 时间格式化工具（Date.toLocaleTimeString）
```

## 模块依赖方向

```
domain/  ←  game/  ←  stores/  ←  components/
                    ←  rendering/
```

- `domain/` 无框架依赖，纯数据和几何
- `game/` 依赖 `domain/`，采用 composable 模式导出 `create*Actions(deps)` 函数
- `stores/` 依赖 `domain/` + `game/`，Pinia store 声明 state 并组装 composable
- `rendering/` 依赖 `domain/` + `game/`（仅类型），纯函数，接收只读快照
- `components/` 依赖 `stores/` + `rendering/`，通过 Pinia `useGameStore()` 通信
- 无循环依赖

## 规范遵守情况

| 规则 | 状态 |
|------|------|
| 单文件 ≤100 行有效代码 | ✓ 全部通过（最大 96 行 store，95 行 path-editing） |
| 单一职责原则（SRP） | ✓ 每个文件只负责一个明确功能 |
| 每文件夹 ≤5 个脚本文件 | ✓ domain(5), game(5), stores(5), rendering(5), styles(4), components(3+子3) |
| 模块边界清晰，无循环依赖 | ✓ |
