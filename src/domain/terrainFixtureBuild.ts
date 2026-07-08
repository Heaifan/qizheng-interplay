// ============================================================
// terrainFixtureBuild — 内置测试地图地貌装配
//
// 按固定顺序铺设水文与地势图层，保持本文件 ≤100 行。
// 具体地貌绘制分散在 terrainFixtureHydro / terrainFixtureRelief。
// ============================================================

import { type BattleTerrainMap } from './terrainMap';
import { buildHydro } from './terrainFixtureHydro';
import { buildRelief } from './terrainFixtureRelief';

export function buildFixtureLayers(map: BattleTerrainMap): void {
  buildHydro(map);
  buildRelief(map);
}
