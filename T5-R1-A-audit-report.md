# qizheng-interplay v0.6.0-T5-R1-A 地形战斗闭环只读审计报告

> **审计性质：只读**。未修改任何生产代码、未新增地形规则、未提交。
> **判定优先级（用户规定）**：真实代码 > changelog.md > file-tree.md > README > .workbuddy/MEMORY.md。本报告全部以真实代码为准。
> **审计对象**：`E:/MyDoc/project-VSCode/qi-zheng-interplay`（TypeScript + Vite + Electron，git 仓库，最新提交 `633ae6a v0.6.0-T4：射界/视距查询地形`）。
> **红线基准**：沿用 webUI 的 5+100（单文件 ≤100 行）。interplay 自身文档未重述此约束，但本审计按 T5-R1-A 口径第 1 项要求核查。
> **生成时间**：2026-07-08。

---

## 0. 一句话结论

**地形数据已建好，但"地形改变战斗决策"这条主线在实战中是断的。**
- ✅ 移动路径：实战吃地形（水体阻挡 + 森林/灌木/坡地/高地减速）已闭合。
- ❌ 战斗结算：`combat.ts` 开火主流程**未把地图传给 `calculateDirectFireContext`**，地形对命中率/遮挡的修正（T4 宣称已做）在真实射击里完全不生效。
- ❌ 派生地形：`deriveTerrain` 函数**不存在**，`derived` 图层从未填充 → 高地/坡地遮挡、坡地减速在实战中永远不触发。
- ❌ 可读性：数据层算出 `terrainBlocked`，但 `.vue` UI 层零消费，玩家看不到"被地形挡住"。
- ❌ 中文日志：`formatSightDebug`（视距/命中系数中文日志）全代码零调用；`combat.ts` 日志也不含 `terrainBlocked`/`terrainHitModifier`。

---

## 1. 当前真实文件结构（节选相关模块 + 红线）

### 1.1 地形数据层 `src/domain/`
| 文件 | 行数 | ≤100 | 说明 |
|---|---|---|---|
| `terrainMap.ts` | **139** | ❌ | `BattleTerrainMap`/`TerrainCellInfo`/枚举 + `createEmptyTerrainMap`/`cloneTerrainMap`。注释称 `derived` 运行前由 `deriveTerrain` 填充 |
| `terrain/terrainQuery.ts`(顶层门面) | 37 | ✅ | re-export `terrainCoord`/`terrainCellQuery`/`terrainSegmentSample`，保持 `@/domain/terrainQuery` 路径兼容 |
| `terrain/terrainSegmentSample.ts` | 80(估) | ✅ | 实现 `sampleSegmentTerrain` |
| `terrain/terrainCellInfo.ts` | 63 | ✅ | 实现 `getCellInfo`/`getTerrainCell` |
| `terrainFixture.ts` | **165** | ❌ | 内置 96×64 测试地图（河/林/山脊/盆地/高原），**返回不含 `derived`** |

### 1.2 游戏逻辑层 `src/game/`
| 文件 | 行数 | ≤100 | 说明 |
|---|---|---|---|
| `movement.ts` | 81 | ✅ | `advanceUnitAlongPath` → 调 `sampleMoveSegment` 应用 `seg.factor`/`seg.blocked` |
| `terrainMoveFactor.ts` | 37 | ✅ | `calcMoveFactor(cell)` —— **全代码零调用（死代码）** |
| `terrainMoveBlock.ts` | 12 | ✅ | `isMoveBlockedByTerrain`：`water>0` 阻挡 |
| `terrainMoveSample.ts` | 51 | ✅ | `sampleMoveSegment` 内联系数（dirt .85/high .90/forest .65/bush .80/slope .75） |
| `combatFormula.ts` | 79 | ✅ | `calculateDirectFireContext(attacker,target,map?)`；`if(map)` 分支读 `sampleSightLine`+`calcHitModifier` |
| `combat.ts` | **145** | ❌ | `tryFire` 调 `calculateDirectFireContext(attacker,target)` **无 map** |
| `directFireContext.ts` | 31 | ✅ | `DirectFireContext` 接口含 `terrainHitModifier`/`terrainBlocked` |
| `terrainSightFactor.ts` | 24 | ✅ | `calcSightModifier`/`calcHitModifier`（forest 命中.70/视距.65；bush 命中.85/视距.80） |
| `terrainSightSample.ts` | 56 | ✅ | `sampleSightLine`：植被削弱 + 高度遮挡（`info.derived` 判定高地/坡地） |
| `readability.ts` | 79 | ✅ | `computeReadabilityHints(units,map)` 含 `terrainBlocked` 字段 |
| `terrainMoveDebug.ts` | 34 | ✅ | `formatMoveDebug` 中文移动日志 |
| `terrainSightDebug.ts` | 31 | ✅ | `formatSightDebug` 中文视距/命中日志 —— **全代码零调用** |
| `path-editing.ts` | **105** | ❌ | 超线 |

### 1.3 红线总体
- **核心逻辑**：`terrainMap.ts`(139)、`combat.ts`(145)、`terrainFixture.ts`(165)、`path-editing.ts`(105) 超 100。
- **UI 组件**：普遍超线（最高 `UnitEditor.vue` 488、`FireOutputChart.vue` 239、`CasualtyChart.vue` 197、`BattleLogPanel.vue` 175、`drawUnits.ts` 165、`fireOutputGenerator.ts` 142、`gameStore.ts` 154、`useCanvasInput.ts` 204、`unitGlyphs.ts` 153、`battleReport.ts` 166、`drawSectors.ts` 122）。
- **结论**：与"T1-R1/R2 文件拆分与 ≤100 行收口已完成"的进度记录矛盾——核心地形/战斗文件未守红线。

---

## 2. 地形战斗数据流

```
BattleTerrainMap { height / natural / water / vegetation [ + derived? ] }
        │
        ▼
terrainQuery(门面) ──► terrainSegmentSample.sampleSegmentTerrain / terrainCellInfo.getCellInfo
        │
        ├─► 移动链  movement.advanceUnitAlongPath(unit, speed, map?)
        │        └─► terrainMoveSample.sampleMoveSegment(map,…) → { factor, blocked(touchesWater) }
        │        └─► movement 应用 seg.factor 到速度；seg.blocked 时停车  ✅ 实战闭合
        │
        ├─► 战斗链  combat.tryFire ─► combatFormula.calculateDirectFireContext(attacker, target[, map])
        │        ├─ 有 map：terrainSightSample.sampleSightLine → terrainSightFactor.calcHitModifier
        │        │           → terrainHitModifier 乘入 hitChance；terrainBlocked 影响 protectionLevel
        │        └─ 无 map（当前 combat.ts 实际走的）：terrainHitModifier=1, terrainBlocked=false  ❌ 实战断开
        │
        ├─► 可读性链  stores/derived.ts computed ─► readability.computeReadabilityHints(units, map)
        │        └─► ReadabilityHint{ terrainBlocked, hitChance, … }（数据+store 通，UI 不消费）  ❌
        │
        └─► 日志链  terrainMoveDebug.formatMoveDebug（仅阻挡时） / terrainSightDebug.formatSightDebug（零调用）
```

---

## 3. 移动闭环验收表

| 检查点 | 代码位置 | 结果 |
|---|---|---|
| 移动读取地形移动系数 | `movement.ts:42` 调 `sampleMoveSegment`；`:51` 用 `seg.factor` | ✅ 闭合 |
| 水体阻挡移动 | `terrainMoveBlock.ts:11` `water>0`；`terrainMoveSample.ts:43` blocked；`movement.ts:44` 停车 | ✅ 闭合 |
| 森林/灌木/坡地/高地影响路径 | `terrainMoveSample.ts:44-48` 内联系数 | ✅ 有 |
| `calcMoveFactor` 是否被调用 | `terrainMoveFactor.ts:21` 定义 | ❌ **零调用**（死代码；与 `sampleMoveSegment` 内联逻辑重复，未来易分叉） |
| 移动中文日志可解释系数 | `formatMoveDebug` 仅在 `movement.ts:47` `seg.blocked` 时输出 | ⚠️ 正常/减速移动不打日志 |

---

## 4. 射界 / 命中闭环验收表

| 检查点 | 代码位置 | 结果 |
|---|---|---|
| `combatFormula` 读取 `terrainHitModifier` | `combatFormula.ts:42-44` `sampleSightLine`+`calcHitModifier`；`:60` 乘入 `hitChance` | ✅ 逻辑实现 |
| 森林/灌木降低命中 | `terrainSightFactor.ts:18-24` forest .70 / bush .85 | ✅ |
| 高地/坡地遮挡 | `terrainSightSample.ts:38-43` 高度遮挡（依赖 `info.derived`） | ⚠️ 依赖 `derived` 图层 |
| **`combat` 主战斗是否传 `map`** | `combat.ts:33` 仅 `(attacker, target)` | ❌ **实战不吃地形**（T4 名义完成，实战断链） |
| `readability` 预览是否传 `map` | `readability.ts:54` 传 `map` | ✅ 预览吃地形 |
| `derived` 图层是否填充 | `deriveTerrain` 函数**全代码不存在**（仅 `terrainMap.ts:65` 注释提及） | ❌ 高地/坡地判定恒 false |
| 坐标系一致性 | `terrainSightSample.ts:41-42` `lineH` 用 `/cellMeters` 假设 `x/y` 为世界坐标 | ⚠️ 待查 `RuntimeUnit.x/y` 语义 |

---

## 5. 可读性 / 日志闭环验收表

| 检查点 | 代码位置 | 结果 |
|---|---|---|
| `readability` 算出 `terrainBlocked` | `readability.ts:54,67` 传 `map` 并读 `ctx.terrainBlocked` | ✅ 数据层通 |
| store 消费 readability | `stores/derived.ts:49` `computed(() => computeReadabilityHints(d.units.value, d.terrainMap.value))` | ✅ store 层通 |
| **UI 是否展示 `terrainBlocked`** | `.vue` 组件对 `terrainBlocked`/`ReadabilityHint`/`readability` **零匹配** | ❌ 玩家看不到地形阻挡 |
| `combat` 日志是否含 `terrain*` | `combat.ts:71-74` 仅 `ctx.blocked`(覆盖物)/`ctx.throughBush`(灌木)，无 `terrainBlocked`/`terrainHitModifier` | ⚠️ 缺地形日志 |
| `formatSightDebug` 是否被调用 | 全 `src` 零调用 | ❌ 中文射界/命中日志完全缺失 |
| `formatMoveDebug` 调用 | 仅 `movement.ts:47` 阻挡时 | ⚠️ 减速不输出 |

---

## 6. 风险清单（按严重度）

### P0 — 链路断，地形在实战中无效
- **R1**：`combat.ts:33` 开火主流程未传 `map` → 实战命中率/遮挡不吃地形。`combat.ts` 的 `CombatDeps` 甚至不持有 `map` 引用（而 `gameStore` 持有 `terrainMap`）。T4 宣称"射界/视距查询地形已做"，但只接进了 `readability` 预览，未接进 `combat` 主流程。
- **R2**：`deriveTerrain` 函数不存在，`BattleTerrainMap.derived` 从未填充。`terrainSightSample`/`terrainMoveSample`/`terrainStatsScan` 均读 `info.derived` 判定高地/坡地 → 高地/坡地遮挡与坡地减速在实战中**永远不触发**。`terrainFixture` 也只标 `natural.high`，与采样查的 `derived.high` 语义错配。

### P1 — 部分断链 / 可见性缺口
- **R3**：`terrainMoveFactor.calcMoveFactor` 死代码（零调用），且与 `terrainMoveSample` 内联系数重复。
- **R4**：`terrainSightDebug.formatSightDebug` 零调用 → 视距系数/命中系数的中文日志完全缺失。
- **R5**：`readability` 算出 `terrainBlocked`，但 `.vue` 不消费 → 玩家无感知"为什么打不到/被地形挡"。
- **R6**：`combat.ts` 日志未输出 `terrainBlocked`/`terrainHitModifier`（仅覆盖物/灌木）。
- **R7**：坐标系语义未确认（`terrainSightSample` 的 `lineH` 假设 `x/y` 为世界坐标，需核对 `RuntimeUnit.x/y`）。

### P2 — 红线 / 规范 / 验证
- **R8**：多个核心文件 >100 行（`terrainMap` 139、`combat` 145、`terrainFixture` 165、`path-editing` 105）及 `.vue` 普遍超线，与 T1-R2"`≤100 行收口已完成"矛盾。
- **R9**：`src/tests` 为空（Glob 无文件）→ 无自动化测试用 fixture 验证"地形真的改变战斗"。
- **R10**：`terrainFixture` 不填 `derived`；`natural.high` 与 `derived.high` 语义错配，导致即便未来接 `deriveTerrain`，fixture 也需同步修正。

---

## 7. T5-R1-B 最小修复计划（本轮不执行，供用户裁决）

> 全部遵守 ≤100 行、SRP、禁用垃圾桶命名。不新增导入/导出地图、不改战斗公式主结构、不新增复杂 UI。

1. **[P0/R1] `combat` 接入 `map`**：`CombatDeps` 增加 `map` 字段；`tryFire` 传 `map` 给 `calculateDirectFireContext`。改 `combat.ts` ~+3 行。
2. **[P0/R2] 实现 `deriveTerrain`**：新增 `src/domain/terrain/deriveTerrain.ts`(≤100)，由 `height`+`natural` 计算 `derived.high/slope/low`；在加载 fixture / `gameStore` 初始化时调用填充。同步修正 `terrainFixture` 标注 `derived.high`。
3. **[P1/R4] 接线 `formatSightDebug`**：在开火或预览路径调用，输出中文视距/命中系数。
4. **[P1/R6] `combat` 日志补地形**：输出 `terrainBlocked`/`terrainHitModifier` 文案。
5. **[P1/R5] UI 展示 `terrainBlocked`**：战术地图组件消费 `ReadabilityHint`，加地形遮挡标记。
6. **[P2/R8] 红线治理**：拆分 `terrainMap`(拆 `empty`/`clone`/`derived`)、`combat`(拆伤害/压制)、`terrainFixture`(拆地貌块) 及超线 `.vue`。
7. **[P2/R9] 补自动化测试**：用 `terrainFixture` 断言"有地形 vs 无地形"命中率/移动速度差异。
8. **[P2/R7] 坐标系澄清**：确认 `RuntimeUnit.x/y` 单位，统一 `terrainSightSample` 的 `lineH` 计算。

---

## 8. 给 Codex（或下一轮）的验收口径备忘

- 不要误判回 T1-R1。本轮定位是 **T5-R1 地形战斗闭环验收**，interplay 已越过 T1/T1-R1-R2/T3/T4。
- 本轮 T5-R1-A 产出只读审计；若确认上述 R1/R2 为真实断链，进入 **T5-R1-B** 执行最小修复（上表 1–8），每步 commit，不扩大范围。
- 修复后须用 `terrainFixture` 做差异验证（R9），并在 `combat` 日志与 UI 中能看到 `terrainBlocked`/`terrainHitModifier`/`terrainMoveFactor`（R4/R5/R6）。
