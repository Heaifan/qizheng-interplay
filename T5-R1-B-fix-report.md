# qizheng-interplay v0.6.0-T5-R1-B 收口报告

> 地形战斗闭环 P0 最小修复（terrain-combat-p0-fix）
> 性质：只修 P0 断链，不新增地形规则，不改战斗公式主结构，不做复杂 UI。

## 一、一个必须先纠正的审计误判

T5-R1-A 报告里写「deriveTerrain 不存在 → derived 永远不触发」，**这个前提是错的**。

`terrainCellInfo.ts` 的 `deriveCellType` 是**实时**从 `height` 邻居坡度 + `natural.high` 推算 `derived.high/slope` 的。采样链路（`sampleSightLine` / `sampleMoveSegment`）调 `getCellInfo` 拿到的是现算值，并不依赖 `map.derived` 字段。

推论：
- **P0-1（combat 传 map）单独就能让战斗真正吃地形**——传 map 后，`getCellInfo` 现算的 `derived.high/slope` 触发 `terrainBlocked`，`map.vegetation` 已填触发 `terrainHitModifier<1`。
- `map.derived` 预计算字段此前只被渲染层（`drawBattleTerrainMap`）和 shape-check 消费，战斗采样没读它。

**本轮处理**：仍按口径实现 `deriveTerrain`，但做成**真正被采样链路读取的权威源**——`getCellInfo` 优先读 `map.derived`（缺省回退现算）。这样它既兑现 `terrainMap.ts`「运行前由 deriveTerrain 填充」的契约，又不是死代码，且 P0-2 验收项（derived 能被 terrainSightSample/terrainMoveSample 读取）字面成立。

## 二、修改文件清单

| 文件 | 状态 | 说明 |
|---|---|---|
| `src/game/combat.ts` | 改写 | 145→20 行，仅做装配，真实逻辑下沉 |
| `src/game/combatDeps.ts` | 新增 | CombatDeps 接口 + 常量 + missionTimeLabel |
| `src/game/fireLogFormat.ts` | 新增 | 开火日志文本格式化 |
| `src/game/tryFire.ts` | 新增 | runTryFire 主流程，读 `d.terrainMap` 传 map |
| `src/game/fireResolution.ts` | 新增 | 命中结算/压制/日志落地 |
| `src/domain/terrain/terrainDerive.ts` | 新增 | `computeDerivedAt` + `deriveTerrain` + `reconstructDerived` |
| `src/domain/terrain/terrainCellInfo.ts` | 改写 | 63→50 行，`getCellInfo` 优先读 `map.derived` |
| `src/domain/terrainFixture.ts` | 改写 | 165→44 行，编排 + 末段调用 `deriveTerrain` |
| `src/domain/terrainFixtureBuild.ts` | 新增 | 地貌装配编排 |
| `src/domain/terrainFixtureHydro.ts` | 新增 | 河流 + 森林 |
| `src/domain/terrainFixtureRelief.ts` | 新增 | 山脊 + 盆地 + 高原 |
| `src/stores/gameStore.ts` | 改写 | +1 行：combat 依赖注入 `terrainMap` |

> 未触碰：`terrainMap.ts`（仅类型引用）、`combatFormula.ts`、`directFireContext.ts`、所有 `.vue`、`calcMoveFactor` 死代码（按口径暂缓）。

## 三、拆分前后行数表

| 原文件 | 原行数 | 现构成 | 现行数 |
|---|---|---|---|
| `combat.ts` | 145 | combat.ts(20) + combatDeps(28) + fireLogFormat(58) + tryFire(80) + fireResolution(59) | 均 ≤100 ✅ |
| `terrainFixture.ts` | 165 | terrainFixture(44) + terrainFixtureBuild(15) + terrainFixtureHydro(54) + terrainFixtureRelief(58) | 均 ≤100 ✅ |
| `terrainCellInfo.ts` | 63 | 50 | ≤100 ✅ |
| `terrainMap.ts` | 139 | 未触碰（仅类型引用） | 保持（本轮不治理） |
| `gameStore.ts` | 154 | 155（+1 行） | >100，但属用户清单「不必触碰/暂缓」项，本轮不拆 |

**全项目红线扫描**：除 `gameStore.ts`（154→155，预存债务、用户列为暂缓）及若干 `.vue`/其他模块（均不在本轮触碰范围）外，本轮所有新增/改写文件均 ≤100 行。

## 四、combat 主流程传 map 的数据流

```
gameStore: terrainMap = ref(createFixtureTerrainMap())   // 现已携带 derived
   └─ createCombatActions({ ..., terrainMap })           // 注入 CombatDeps
        └─ runTryFire(d, attacker, target, now)
             const map = d.terrainMap.value ?? undefined
             const ctx = calculateDirectFireContext(attacker, target, map)
                └─ if (map) {                            // 此前恒为 false
                     sight = sampleSightLine(map, ...)
                     terrainBlocked   = sight.blockedByTerrain
                     terrainHitModifier = calcHitModifier(sight)
                   }
             ctx.hitChance *= terrainHitModifier
             protectionLevel = (blocked || terrainBlocked) ? 'medium_cover' : 'none'
```

> 关键：`calculateDirectFireContext` 第三参 `map` 可选，签名未变；只是真实 `tryFire` 链路现在真正把 map 传进去了。

## 五、deriveTerrain 输入 / 输出

- **输入**：`BattleTerrainMap`（需 `height` / `natural`；`water` / `vegetation` 已填）
- **输出**：同一张 map，附 `derived = { high[][], slope[][], low[][] }`（每格 1/0）
- **单格逻辑 `computeDerivedAt`**：
  - `water > 0` → `none`
  - 任意上下左右邻格高度差 `> 0.06` → `slope`
  - `natural === high` → `high`
  - `height < 0.35` → `low`
  - 否则 `none`
- **`reconstructDerived`**：`getCellInfo` 从预计算图层还原单格枚举（坡度优先于高地，再低地）。
- 注：`high/slope` 判定与旧 `deriveCellType` 完全一致（无新战斗数值）；`low` 仅供给 stats / 渲染，不参与命中/遮挡。

## 六、fixture 是否填充 derived

**是。** `createFixtureTerrainMap()` 末尾调用 `deriveTerrain(map)` 后返回。运行时验证：`derived.high / slope / low` 均为 `true`（见下）。

## 七、地形影响真实开火的验证样例（esbuild + node 实跑）

| 场景 | 线段 | touchesForest | blockedByTerrain | terrainHitModifier |
|---|---|---|---|---|
| 无地形（等价无 map） | (780,50)-(880,50) 开阔地 | false | false | **1.00** |
| 森林 | (250,100)-(100,100) | true | false | **0.70**（<1） |
| 高地遮挡 | (760,150)-(340,150) 穿山脊 | — | **true** | 0（命中降为 0） |

对照 `combatFormula.ts`：无 map 时 `terrainHitModifier` 恒为 1、`terrainBlocked` 恒为 false；有 map 后森林/灌木触发 0.70/0.85，高地坡地触发遮挡。结论：**地形现在真实改变开火命中与遮挡。**

## 八、是否触碰 UI

**否。** 未改任何 `.vue`，未做 `terrainBlocked` 玩家可见性（按口径暂缓至 T5-R1-C）。

## 九、是否新增地形规则

**否。** 所有数值（坡度阈值 0.06、低地基准 0.35、命中修正 0.70/0.85、遮挡余量 0.08）均为 `combatFormula` / `sampleSightLine` / 旧 `deriveCellType` 既有值。`deriveTerrain` 对 `high/slope` 的判定与旧逻辑完全一致；`low` 仅喂 stats/渲染，不进战斗公式。

## 十、commit / push

- 分支：`feature/v0.6.0-T5-R1-B`（从 `feature/v0.6.0-T1-terrain-data-storage` 切出，隔离本轮；该分支另有无关的武器/火力输出 WIP 未提交，未纳入本次 commit）
- remote：由 `https://` 切换为 `git@github.com:Heaifan/qizheng-interplay.git`（SSH，复用本地 `id_ed25519`）
- 暂存：**仅本轮 13 个文件**，未触碰其他 WIP
- 类型检查：`vue-tsc --noEmit` 通过，零错误

## 十一、遗留 / 下一轮（T5-R1-C）

按口径暂缓项，建议下一轮处理：
- `terrainBlocked` 在 UI 层可见（玩家看懂「为什么打不到」）
- `formatSightDebug` 中文射界日志接线
- combat 日志增强（移动减速/水体阻挡中文说明）
- `calcMoveFactor` 死代码治理（移动链已闭合，可清）
- 全项目 `.vue` 红线治理（不在本轮）
