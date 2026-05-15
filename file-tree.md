# 项目文件树 — 奇正相生：战斗模拟器

> **当前版本：** v0.3.1.1.5
> **创建时间：** 2026-05-09
> **最后编辑：** 2026-05-15 11:27

> 本文件用于记录项目目录结构、模块职责与版本演进。  
> 每次 AI 或人工修改代码后，如涉及新增、删除、重命名文件，必须同步更新本文档。

---

## 当前版本更新日志 — v0.3.1.1.5

> 发布日期：2026-05-15

### 修复
- **单位选择状态解耦**：新增 `selectUnitByPoint()` 纯查看选择函数，与 `selectPlannerByPoint()` 规划选择分离
- **双击地图单位切换右侧档案**：双击/左键点击单位可切换右侧单位档案，运行中也可查看
- **UnitEditor 跟随 highlightedUnitId**：右侧面板通过 `highlightedUnitId` 自动同步，不再依赖独立单位选择按钮

### 优化
- 右键仍进入路径规划模式，左键/双击仅切换查看
- `selectPlannerByPoint` 内部调用 `selectUnitByPoint`，执行中不拒绝选择

---

## 前版更新日志 — v0.3.1.1.4

> 发布日期：2026-05-15

### 新增
- **FireOutput 交互分析图**：新增 `FireOutputChart.vue`，SVG 曲线支持 hover 探针读数、click 锁定距离、目标输出表动态联动
- **当前单位摘要**：右侧顶部删除旧「单位选择」按钮，改为「当前单位」信息卡，显示单位名、阵营、武器名、效果等级

### 优化
- FireOutput 曲线高度增至 130px，补齐 X 轴距离刻度（0m/500m/1000m）、Y 轴输出提示、距离段标识（近距/中距/远距/极限）
- 探针竖线 + 高亮圆点 + 实时读数标签，hover 时更新目标输出表，click 锁定分析距离
- 解除锁定按钮重置 hover 状态

---

## 1. 项目概览

**奇正相生** 是《孙子引擎》的第一阶段原型，用于验证：

- 1v1 战术推演沙盒；
- 路径规划与时间轴回放；
- 武器参数与单位战斗档案；
- 后续六力模型、三状态与无 HP 伤势系统接入。

当前技术栈：

| 类型 | 技术 |
|---|---|
| 前端框架 | Vue 3 |
| 状态管理 | Pinia |
| 构建工具 | Vite |
| 桌面封装 | Electron |
| 渲染方式 | Canvas 2D |
| 语言 | TypeScript |

---

## 2. 顶层目录结构

```text
qi-zheng-interplay/
├── electron/                 # Electron 主进程与启动包装
├── src/                      # 主程序源码
├── index.html                # HTML 入口
├── package.json              # 项目依赖与脚本
├── tsconfig.json             # TypeScript 配置
├── vite.config.ts            # Vite 配置
├── env.d.ts                  # Vite / Vue 类型声明
└── file-tree.md              # 项目结构说明文档
```

---

## 3. src 目录结构

```text
src/
├── main.ts                   # 应用入口
├── app/                      # 根布局
├── domain/                   # 纯数据、类型、几何与地形
├── game/                     # 游戏逻辑与规则计算
├── stores/                   # Pinia 状态管理
├── rendering/                # Canvas 渲染层
├── components/               # Vue 组件层
├── styles/                   # 全局样式与主题
└── utils/                    # 通用工具函数
```

---

## 4. 模块职责说明

| 模块 | 职责 | 是否依赖 Vue/Pinia |
| --- | --- | --- |
| `domain/` | 类型定义、单位模板、武器推导、几何计算、地形数据 | 否 |
| `game/` | 移动、战斗、路径编辑、时间轴、战术可读性计算 | 否 |
| `stores/` | Pinia 状态、执行控制、回放、会话管理 | 是 |
| `rendering/` | Canvas 绘制，不持有业务状态 | 否 |
| `components/` | Vue UI 与用户交互 | 是 |
| `styles/` | 主题、布局、控制条、地图、右侧面板样式 | 否 |
| `utils/` | 通用工具函数 | 否 |

---

## 5. 关键文件职责

### 5.1 根目录

| 文件 | 职责 |
| --- | --- |
| `index.html` | HTML 入口，挂载 `#app` 并引入 `/src/main.ts` |
| `package.json` | 项目元信息、依赖声明与 npm scripts |
| `tsconfig.json` | TypeScript 编译配置 |
| `vite.config.ts` | Vite 构建配置，包含 Vue 插件与 `@/` 别名 |
| `env.d.ts` | Vite / Vue SFC 类型声明 |
| `file-tree.md` | 项目文件树与模块说明文档 |

### 5.2 electron/

| 文件 | 职责 |
| --- | --- |
| `electron/main.cjs` | Electron 主进程，创建 `BrowserWindow`，处理 dev/prod 模式 |
| `electron/run.cjs` | Electron 启动包装，清除 `ELECTRON_RUN_AS_NODE` 环境变量 |

### 5.3 src/domain/

| 文件 | 职责 |
| --- | --- |
| `types.ts` | 全部核心 TypeScript 类型：`RuntimeUnit`、`WeaponProfile`、`CombatProfile` 等 |
| `constants.ts` | 画布尺寸、网格比例、移动速度、弹道衰减等基础常量 |
| `units.ts` | 蓝方 / 红方单位模板与 `RuntimeUnit` 工厂函数 |
| `weapon.ts` | **武器基础推导唯一来源**：`weaponAccuracy` / `effectiveRange` / `terminalEffect` / `fireTempo` / `directFireContribution` |
| `fireOutput.ts` | 火力输出模型：`TargetType`、`FireOutputContext`、`calculateFireOutput` — EffectClass × 距离 × 防护 × 投送方式 |
| `fireOutputTables.ts` | 火力输出系数表：`EFFECT_CLASS_BASE`、`KINETIC_RANGE_FACTORS`、`PROTECTION_FACTORS` |
| `helpers.ts` | 通用工具：`clamp` |
| `camera.ts` | 战场相机：`CameraState`、`screenToWorld` / `worldToScreen`、`zoomAtScreenPoint`，1 world unit = 1 米 |
| `angles.ts` | 角度工具：`normalizeAngleRad`、`angleDiffRad`、`bearingBetween`、`radToDeg` |
| `geometry.ts` | 纯几何计算：线段相交、矩形遮挡、灌木距离判定 |
| `terrain.ts` | 当前关卡地形数据：掩体矩形与灌木圆形 |

### 5.4 src/game/

| 文件 | 职责 |
| --- | --- |
| `movement.ts` | 沿路径推进单位，更新位置与朝向 |
| `combat.ts` | 射击、命中、冷却、伤害与遮蔽修正（使用 `combatFormula.ts` 结算，命中后通过 `fireOutput.ts` 计算实际毁伤），统一命中/击毙日志 |
| `combatFormula.ts` | 直接火力战斗上下文：基于武器推导 + 单位状态 + 地形条件计算 `hitChance` / `averageDamage` / `fireCooldownMs` / `firePressure`（`averageDamage` 使用 `fireOutput.ts`） |
| `path-editing.ts` | 路径编辑流程：开始、扩展、平滑、确认、撤销、重做 |
| `timeline.ts` | 时间轴管理：快照克隆、恢复、提交、基线持久化 |
| `readability.ts` | 战术可读性计算：扇区、角度、距离、命中估算 |

### 5.5 src/stores/

| 文件 | 职责 |
| --- | --- |
| `gameStore.ts` | 核心 Pinia Store，声明状态并组装各逻辑模块 |
| `derived.ts` | 派生状态：`readabilityHints`、`renderSnapshot`、`unitFields` |
| `execution.ts` | 执行控制：`tick`、`runSimulationTick`、播放 / 暂停 / 继续 |
| `session.ts` | 会话管理：初始化游戏、按坐标选择规划单位 |
| `playback.ts` | 回放控制：后退、前进、时间轴跳转 |

### 5.6 src/rendering/

| 文件 | 职责 |
| --- | --- |
| `tacticalCanvasRenderer.ts` | Canvas 渲染协调器，按顺序调用各子渲染函数 |
| `drawTerrain.ts` | 绘制地图底色、掩体、灌木 |
| `drawViewportGrid.ts` | 视口网格：基于 camera 当前可见范围铺 100m 世界坐标网格 |
| `drawScaleBar.ts` | 动态比例尺 overlay，随 zoom 显示 25m/50m/100m/200m 等 |
| `drawSectors.ts` | 绘制三层单位场：感知场、火力场、控制场 |
| `drawPathsShots.ts` | 绘制规划路径、路径箭头与交火可读性连线 |
| `drawUnits.ts` | 绘制单位、血条、方向指示器、高亮光环和弹道轨迹 |

### 5.7 src/components/

| 文件 | 职责 |
| --- | --- |
| `TacticalMapCanvas.vue` | Canvas 交互组件，负责绑定鼠标、触摸与渲染循环 |
| `GameToolbar.vue` | 底部播放控制栏：播放、暂停、步进、撤销、重做、时间轴、重置 |
| `BattleLogPanel.vue` | 右侧面板，包含战斗日志与单位档案 Tab |
| `UnitEditor.vue` | 单位参数调试器，编辑三状态、六力与武器参数 |

### 5.8 src/components/

| 文件 | 职责 |
| --- | --- |
| `FireOutputChart.vue` | 火力输出交互分析图：SVG 距离-输出曲线 + hover 探针 + click 锁定 + 目标输出表联动 |

### 5.9 src/components/canvas/

| 文件 | 职责 |
| --- | --- |
| `useCanvasInput.ts` | 鼠标输入处理：坐标转换、按下、移动、抬起、右键、双击 |
| `useCanvasTouch.ts` | 触摸输入处理：拖动、结束、双击检测 |
| `useAnimationLoop.ts` | `requestAnimationFrame` 循环，负责 tick 与渲染调用 |

### 5.10 src/styles/

| 文件 | 职责 |
| --- | --- |
| `theme.css` | CSS 变量与浅色竹简 / 羊皮纸主题 |
| `layout.css` | 全局布局、标题区、主战术布局 |
| `controls.css` | 底部播放控制栏、按钮、滑条、禁用状态 |
| `battlefield.css` | Canvas 地图与右键菜单样式 |
| `log-panel.css` | 右侧面板、Tab、日志、单位档案相关样式 |

### 5.11 src/utils/

| 文件 | 职责 |
| --- | --- |
| `timeFormat.ts` | 时间格式化工具 |

---

## 6. 模块依赖方向

```text
domain/  ←  game/  ←  stores/  ←  components/
                    ←  rendering/
```

依赖约束：

1. `domain/` 不依赖任何上层模块。
2. `game/` 可以依赖 `domain/`，但不能依赖 Vue、Pinia 或组件。
3. `stores/` 可以依赖 `domain/` 与 `game/`。
4. `rendering/` 只接收只读快照，不直接修改 Store。
5. `components/` 通过 Pinia 与渲染函数通信。
6. 禁止循环依赖。
7. 禁止在 Vue 组件中直接写复杂战斗规则。

---

## 7. 当前架构原则

### 7.1 分层原则

```text
数据定义 → 规则计算 → 状态管理 → 渲染/UI
```

| 层级 | 说明 |
| --- | --- |
| 数据定义 | 类型、常量、地形、武器、单位基础资料 |
| 规则计算 | 移动、战斗、路径、时间轴、可读性 |
| 状态管理 | 当前局势、播放状态、路径规划、日志、回放 |
| 渲染 / UI | Canvas 绘制、按钮、面板、输入组件 |

### 7.2 当前不做的内容

当前原型暂不开发：

- 训练模板系统；
- 部队层次树；
- 1d10 伤势系统；
- 士气崩溃；
- AI 行为标签；
- 控制场流体系统；
- C# / 孙子引擎正式版迁移；
- 持久化存档；
- 联机系统。

---

## 8. 版本历史

| 版本 | 日期 | 类型 | 说明 |
| --- | --- | --- | --- |
| `v0.3.1.1.5` | 2026-05-15 | 修复 | 单位选择状态解耦：`selectUnitByPoint` 纯查看 + 双击切换右侧档案 + 运行中可查看 |
| `v0.3.1.1.4` | 2026-05-15 | 修复 | FireOutput 图表阶梯线修复 + 播放/暂停按钮前置：step path 对齐、采样点边界化、工具栏顺序调整 |
| `v0.3.1.1.3` | 2026-05-15 | 功能 | FireOutput 交互分析优化：交互 SVG 探针曲线 + 单位选择器删除 + 当前单位摘要 + 目标输出表联动 |
| `v0.3.1.1.2` | 2026-05-15 | 功能 | 火力输出可视化补丁：曲线生成函数 + 单位档案 FireOutput 表 + SVG 距离曲线 + 日志中文标签 |
| `v0.3.1.1.1` | 2026-05-15 | 修复 | FireOutput 语义清理 + 回放控制补丁：outputMode 分表、combatFormula 合流、播放/暂停 toggle + rewindToStart |
| `v0.3.1.1` | 2026-05-15 | 功能 | 六力模型·打击力专题：火力输出 — EffectClass × 距离 × 防护 × 投送方式推导命中毁伤 |
| `v0.2.4.3.3` | 2026-05-15 | 修复 | 工具栏事件隔离 + 测距性能修复：RAF 节流 + 模式切换清理 |
| `v0.2.4.3.2` | 2026-05-15 | 修复 | 单位图标锁定 + 规划模式路径修复 + Electron 重启守卫 |
| `v0.2.4.3` | 2026-05-14 | 功能 | 测距工具：Alt+drag 距离/方位角测量 |
| `v0.2.4.2.3` | 2026-05-13 | 修复 | 比例尺驱动动态网格 |
| `v0.2.4.2.2` | 2026-05-10 | 功能 | PC/App 视图适配：Pointer Events + 中键/空格平移 + 双指缩放 + 交互模式 + 单位名称 Overlay |
| `v0.2.4.2.1` | 2026-05-10 | 修复 | 比例尺/网格坐标统一：视口网格 `drawViewportGrid.ts`，删除旧 `drawGridAndScale`，米制统一 |
| `v0.2.4.2` | 2026-05-10 | 功能 | 地图缩放 + 动态比例尺：`camera.ts` / `drawScaleBar.ts`，0.5x–4.0x 滚轮缩放 |
| `v0.2.4.1` | 2026-05-10 | 重构 | 武器公式源统一：`domain/weapon.ts` 为唯一起源，`combatFormula.ts` 复用 |
| `v0.2.4` | 2026-05-10 | 功能 | 武器挂载卡片 + 直接火力公式：`combatFormula.ts`，Kar98k/M91/30 参与命中率/伤害/冷却 |
| `v0.2.3` | 2026-05-10 | 修复 | 方向系统统一：共享角度工具 + 开火时同步 `angle` + 扇区中心线 + 日志强化 |
| `v0.2.2` | 2026-05-09 | 渲染 | 扇区语义拆分：感知场 (110°/700m)、火力场 (60°/effectiveRange)、控制场 (80°/≤250m) |
| `v0.2.1` | 2026-05-09 | UI | 浅色竹简 / 羊皮纸风格 UI，单位档案卡视觉改版，播放条图标替换，战斗日志事件标签化 |
| `v0.2.0` | 2026-05-09 | 功能 | 新增 `WeaponProfile` / `CombatProfile` 类型与单位参数调试器 |
| `v0.1.x` | — | 原型 | 基础 1v1 战术推演沙盒：HP 制战斗、路径规划、时间轴回放 |

---

## 9. 后续版本计划

| 版本 | 目标 |
| --- | --- |
| `v0.3.1.1` | 打击力·火力输出：EffectClass × 距离 × 防护 × 投送方式 |
| `v0.3.1.2` | 打击力·火力精度：准确度与命中判定系统 |
| `v0.3.1.3` | 打击力·压制能力：压制与恐慌传导 |
| `v0.3.1.4` | 打击力·火力持续：弹药管理与持续射击 |
| `v0.3.2+` | 其余五力（机动、生存、感知、控制、保障）逐步接入 |
| `v0.4.0` | 替换 HP 系统，引入 1d10 伤势判定 |
| `v0.5.0` | 初步接入三状态对战斗表现的影响 |
| `v0.6.0` | 单兵到班级的聚合验证 |

---

## 10. 文档维护规范

每次修改代码后，必须检查是否需要更新本文档。

### 10.1 必须更新的情况

- 新增文件；
- 删除文件；
- 重命名文件；
- 移动目录；
- 文件职责发生明显变化；
- 新增模块；
- 架构依赖方向变化；
- 新增版本 tag；
- 新增长期计划或取消原计划。

### 10.2 不必更新的情况

- 只修改函数内部实现；
- 只调整 CSS 细节；
- 只修复 bug；
- 只修改文案；
- 不改变文件职责的小范围重构。

### 10.3 AI 修改代码后的检查清单

每次提交代码后，检查：

```text
[ ] 是否新增 / 删除 / 重命名文件？
[ ] 是否改变现有文件职责？
[ ] 是否引入新的模块目录？
[ ] 是否破坏模块依赖方向？
[ ] 是否需要更新版本历史？
[ ] 是否需要更新后续版本计划？
```

如答案为"是"，必须同步修改 `file-tree.md`。

---

## 11. 备注

本文档只描述项目结构和模块职责，不记录具体算法细节。

具体设计文档应拆分到独立文件，例如：

```text
docs/
├── six-forces-design.md
├── combat-resolution.md
├── control-field-design.md
├── training-system-parking-lot.md
└── ui-style-guide.md
```
