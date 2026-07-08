// ============================================================
// terrainFixtureHydro — 内置测试地图水文与植被
//
// 铺设河流（先挖低再铺水）与森林（方块林 + 半月林）。
// 仅写图层数据，不做派生计算（由 deriveTerrain 完成）。
// ============================================================

import {
  type BattleTerrainMap,
  NaturalTerrain,
  WaterTerrain,
  VegetationTerrain,
} from './terrainMap';

export function buildHydro(map: BattleTerrainMap): void {
  const { cols, rows, height, natural, water, vegetation } = map;

  // 1. 河床（先挖低，再铺水）
  for (let row = 0; row < rows; row++) {
    const t = row / rows;
    const center = 10 + t * 70 + Math.sin(t * Math.PI * 3) * 15;
    const halfWidth = 1.5 + Math.sin(t * Math.PI * 2) * 0.5;
    for (let d = -Math.ceil(halfWidth); d <= Math.ceil(halfWidth); d++) {
      const col = Math.round(center + d);
      if (col < 0 || col >= cols) continue;
      const dist = Math.abs(d);
      const depth = dist <= 1 ? -0.25 : -0.10;
      height[row][col] = Math.max(0, 0.45 + depth);
      water[row][col] = WaterTerrain.river;
      vegetation[row][col] = VegetationTerrain.none;
      natural[row][col] = NaturalTerrain.grass;
    }
  }

  // 2. 森林：左上方块林 + 右下半月林
  for (let row = 5; row <= 18; row++) {
    for (let col = 5; col <= 20; col++) {
      if (water[row][col] > 0) continue;
      vegetation[row][col] = VegetationTerrain.forest;
      height[row][col] = Math.max(0, height[row][col] - 0.02);
    }
  }
  for (let row = 35; row <= 50; row++) {
    for (let col = 55; col <= 75; col++) {
      if (water[row][col] > 0) continue;
      const dx = col - 65, dy = row - 42;
      const dist = Math.hypot(dx, dy);
      if (dist < 10 && dy > -3) {
        vegetation[row][col] = VegetationTerrain.forest;
        height[row][col] = Math.max(0, height[row][col] - 0.02);
      }
    }
  }
}
