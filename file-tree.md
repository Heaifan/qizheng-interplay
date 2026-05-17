# 项目文件树 — 奇正相生：战斗模拟器

> **当前版本：** v0.4.1.4
> **创建时间：** 2026-05-09
> **最后编辑：** 2026-05-16 17:02

> 本文件用于记录项目目录结构、模块职责与版本演进。  
> 每次 AI 或人工修改代码后，如涉及新增、删除、重命名文件，必须同步更新本文档。

---

## 当前版本更新日志 — v0.4.1.4

> 发布日期：2026-05-16
> Release：[v0.4.1.4](https://github.com/Heaifan/qizheng-interplay/releases/tag/v0.4.1.4)

### 调整
- **兵牌武器符号定稿**：按新规范重绘 5 类图标（步枪单箭头 → 自动步枪 +1横 → 冲锋枪 +2横 → 轻机枪 +脚架 → 重机枪 +3横+脚架）
- `WeaponIconKind` 统一为 `rifle/automatic_rifle/submachine_gun/light_machine_gun/heavy_machine_gun`
- 自动武器改为点射事件模型，`shotIntervalMs` 表示点射间隔
- MG34/ZB26 等武器参数调整为点射间隔（700-800ms）

### 修复
- **MG34 瞬秒修复**：删除 `sqrt(rounds)` 伤害放大，改为 `burstDmgMult` 线性增量（5 发=×1.40）
- 点射伤害与压制倍率分离，压制倍率更高（5 发=×2.00）
- 使用仿真时间（`simElapsedMs`）而非 `Date.now()`
- 先判射程/射界再扣弹
- glyph 使用 `aimAngle` 而非 `angle`

### 新增
- 装填完成日志
- 日志显示伤害倍率与压制倍率
- **战斗报告导出**：`battleReport.ts` + `downloadText.ts`，右侧面板「导出」按钮生成 Markdown 文件（含参战单位、火力统计、战损统计、完整日志）
- 日志显示「有效压制」字段
- 报告过滤重复操作日志，战损统计只保留变化点

---

## 前版更新日志 — v0.4.1.2

> 发布日期：2026-05-16
> Release：[v0.4.1.2](https://github.com/Heaifan/qizheng-interplay/releases/tag/v0.4.1.2)

### 修复
- **兵牌图标方向修复**：所有 glyph 路径重写，枪口统一朝 +X 方向，配合 aimAngle 指向射击目标
- **冲锋枪/机枪图标重绘**：SMG 不再像 H，MG 不再糊成黑块
- **图标缩放稳定**：glyph 绘制加入 `ctx.scale(1/zoom)`，缩放地图时图标大小保持稳定
- **新增 aimAngle**：RuntimeUnit 增加 aimAngle 字段，开火时更新，glyph 旋转使用 aimAngle

### 新增
- **武器射击循环系统**：弹匣容量 / 射击间隔 / 换弹时间 / 射击模式
- **`weaponRuntime.ts`**：`tryConsumeShot()` 弹药消耗与冷却统一管理
- **`WeaponRuntimeState`**：运行时弹量、换弹、冷却状态记录
- 战斗日志显示弹量（`弹仓 4/5`）和点射发数（`点射3发`）
- 自动武器按 burst 消耗弹药，换弹期间不产生射击线
- 时间轴快照深度克隆 weaponState，回放弹量正确恢复

---

## 前版更新日志 — v0.4.1.1

> 发布日期：2026-05-16
> Release：[v0.4.1.1](https://github.com/Heaifan/qizheng-interplay/releases/tag/v0.4.1.1)

### 新增
- **JSON 武器数据入口**：`src/data/weapons/builtin.weapons.json`，8 把武器从 TS 表迁移至 JSON
- **WeaponRegistry**：统一武器注册/查询，支持 `getWeaponById` / `listWeapons`
- **Path2D 兵牌图标系统**：`unitGlyphs.ts`，每种武器绑定 iconKind（rifle/smg/machine_gun 等），兵牌内图标跟随武器变化
- **单位显示派生**：`unitDisplay.ts`，单位名称根据阵营+武器动态生成（德军步枪手、苏军冲锋枪手等）
- **冲锋枪输出档案**：`smg_direct` + `smg_kinetic` 衰减模型，MP40/PPSh-41 不再使用全威力步枪弹档案

### 调整
- `WeaponProfile` 扩展：shortName、country、era、roleLabel、iconKind
- `weaponCatalog.ts` 改为转发到 weaponRegistry
- 单位档案武器下拉框从 registry 读取
- 兵牌内部箭头替换为武器 glyph（跟随朝向旋转）

---

## 前版更新日志 — v0.3.1.1.10

> 发布日期：2026-05-15
> Release：[v0.3.1.1.10](https://github.com/Heaifan/qizheng-interplay/releases/tag/v0.3.1.1.10)

### 修复
- **时间轴基线保护**：timeline 截断保留 frame[0]/frame[1]（初始帧 + 执行基线），播放 30 秒后回到开头不再跳到 T+11s
- **startExecution 顺序重排**：先重置 simElapsedMs/shots/速度 → 设置 executing mode → 保存基线帧，确保基线帧是干净的 T+0s 执行起点
- **playbackMin 改为执行基线索引**：rewindToStart 回到执行起点而非沙盘初始化；canStepBack 使用 playbackMin
- **战损序列从执行基线计算**：`casualtySeries` 从 `playbackMin` 切片，时间相对起点归零

### 修正
- **战损图红蓝标签反置**：红方数值显示为红方、蓝方显示为蓝方
- **tooltip 位置不挡日志**：固定在图表卡片右上角（right:8px top:22px）
- **曲线随播放展开**：`visibleSeries` 按 `currentTimeSec` 过滤，hover 只吸附可见点
- **战损图紧凑化**：单点补水平线避免开局空白；W=320/H=82 扩大绘图区；网格线替代坐标轴；axisMaxTime 稳定化防止图表跳跃

---

## 前版更新日志 — v0.3.1.1.9

> 发布日期：2026-05-15
> Release：[v0.3.1.1.9](https://github.com/Heaifan/qizheng-interplay/releases/tag/v0.3.1.1.9)

### 新增
- **战损统计图**：右下角 SVG 双线图（红方/蓝方 HP%），随播放同步展开
- **鼠标 hover 交互**：垂直线吸附最近时间点 + tooltip（T+xs、双方剩余/战损%）
- 战损卡片压缩布局，扩大绘图区域
- Y 轴 100/50/0%、X 轴 0s/末尾时间
- **战斗日志按 timeMs 过滤**：回到开头只显示 T+0s 日志

### 修复
- seekToFrame 统一跳帧，所有时间轴按钮统一入口
- frame[0] 作为真实初始状态不覆盖
- cloneFrame/restoreFrame 深度克隆 combatProfile

---

## 前版更新日志 — v0.3.1.1.8

> Release：[v0.3.1.1.8](https://github.com/Heaifan/qizheng-interplay/releases/tag/v0.3.1.1.8)

### 修复
- **时间轴初始帧回退修复**：`seekToFrame()` 统一跳帧函数；frame[0] 作为真实初始状态；`cloneFrame`/`restoreFrame` 深度克隆 `combatProfile`
- **武器目录独立**：`weaponCatalog.ts` 含 8 把武器：Kar98k、M91/30、三八式、M1 加兰德、MP40、PPSh-41、MG34、ZB26
- **武器切换**：单位档案增加武器下拉框，切换后实时生效
- **单位引用武器 ID**：`RuntimeUnit.weaponId` 替换直接引用

### 新增
- `src/domain/weaponCatalog.ts` — 独立武器目录

---

## 前版更新日志 — v0.3.1.1.7

> 发布日期：2026-05-15

### 重构
- **FireOutput 输出档案模型**：新增 `WeaponOutputProfile` 概念，运行时输入简化为武器 + 目标 + 距离 + 防护
- **`weaponOutputProfiles.ts`**：输出档案表、距离模型表、`resolveWeaponOutputProfile()` 解析器（优先 outputProfileId，fallback 旧字段）
- **`full_power_rifle_direct` 输出档案**：Kar98k / M91/30 绑定该档案，数值与旧版一致

### 新增
- `FireOutputResult` 增加 `outputProfileId`、`outputProfileLabel`、`outputProfileDescription`
- `WeaponProfile` 新增可选字段 `outputProfileId`

### 优化
- 战斗日志和 FireOutput 图表显示「全威力步枪弹直射」替代旧 effectClass/outputMode
- 旧字段 `family` / `outputMode` / `effectClass` 保留为兼容 fallback

---

## 前版更新日志 — v0.3.1.1.5

### 重构
- **types.ts 拆分为 2 + 1**：`type_weapon.ts`（武器类型）、`type_core.ts`（核心类型）、`types.ts` 降为 barrel
- **fireOutputTables.ts 拆分为 2 + 1**：`data_effectClassBase.ts`（毁伤表）、`data_rangeProtection.ts`（距离/防护系数）、`fireOutputTables.ts` 降为 barrel
- **useCanvasInput.ts 拆分**：提取 `hook_canvasUtils.ts`（坐标转换、平移、RAF 节流工具）
- 所有旧 import 路径不受影响（barrel 向后兼容）

### 修复
- **查看选择与规划选择彻底解耦**：新增 `selectUnitForInspectByPoint()` 纯查看函数，不修改 `activePlannerIdx` / `mode`
- **`selectPlannerByPoint` 独立化**：不再内部调用 inspect，直接设置规划上下文
- **左键/双击只当 `uiPanelTab === 'editor'` 时才切换档案**：战斗日志 tab 下点击单位不再切换右侧面板
- **planPath 模式防误触**：左键点击敌方单位不再触发任何 select 函数，不重置路径
- **UnitEditor 跟随 highlightedUnitId**：右侧面板通过 `highlightedUnitId` 自动同步

### 优化
- 提取 `findNearestUnit()` 共享工具函数
- 右键单位仍然保留完整的规划路径选择功能
- 执行中可查看单位但不进入规划

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
| `types.ts` | **Barrel** — re-export from `type_weapon.ts` + `type_core.ts` |
| `type_core.ts` | 核心类型：`GameMode`、`RuntimeUnit`、`CombatProfile`、`ShotTrail`、`LogEntry` 等 |
| `type_weapon.ts` | 武器类型：`WeaponProfile`、`WeaponFamily`、`OutputMode`、`EffectClass` 等 |
| `constants.ts` | 画布尺寸、网格比例、移动速度、弹道衰减等基础常量 |
| `units.ts` | 蓝方 / 红方单位模板与 `RuntimeUnit` 工厂函数 |
| `weapon.ts` | **武器基础推导唯一来源**：`weaponAccuracy` / `effectiveRange` / `terminalEffect` / `fireTempo` / `directFireContribution` |
| `fireOutput.ts` | 火力输出模型：`calculateFireOutput` — EffectClass × 距离 × 防护 × 投送方式 |
| `fireOutputTables.ts` | **Barrel** — re-export from `data_effectClassBase.ts` + `data_rangeProtection.ts` |
| `data_effectClassBase.ts` | 34 种 EffectClass × 5 种目标类型的基准毁伤表 |
| `data_rangeProtection.ts` | 距离衰减系数表 + 防护系数表 + `getRangeFactorsByOutputMode()` |
| `fireOutputCurve.ts` | 曲线数据生成：`generateFireOutputCurve()`、`generateFireOutputTargetTable()` |
| `fireOutputFormat.ts` | 中文格式化：`formatFireOutputTag()`、`formatEffectClass()`、`formatRangeBand()` 等 |
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
| `useCanvasInput.ts` | 鼠标/指针输入 composable：按下、移动、抬起、右键、双击、滚轮，事件优先级编排 |
| `hook_canvasUtils.ts` | Canvas 输入工具函数：坐标转换、平移、拖拽检测、RAF 节流测距更新 |
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
| `v0.3.1.1.7` | 2026-05-15 | 功能 | 武器目录独立 + 时间轴初始帧修复：seekToFrame 统一跳帧、weaponCatalog 8 把武器、单位档案武器切换、frame[0] 真实初始状态 |
| `v0.3.1.1.6` | 2026-05-15 | 重构 | FireOutput 输出档案重构：WeaponOutputProfile 模型、`resolveWeaponOutputProfile` 解析器、Kar98k/M91/30 绑定 full_power_rifle_direct |
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
├── fire-output-weapon-family-model.md
└── ui-style-guide.md
```
