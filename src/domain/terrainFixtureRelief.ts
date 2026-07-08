// ============================================================
// terrainFixtureRelief — 内置测试地图地势
//
// 铺设山脊（顶端标 high）、盆地（圆形凹陷）、高原（抬升标 high）。
// 仅写图层数据，不做派生计算（由 deriveTerrain 完成）。
// ============================================================

import {
  type BattleTerrainMap,
  NaturalTerrain,
} from './terrainMap';

export function buildRelief(map: BattleTerrainMap): void {
  const { cols, rows, height, natural, water } = map;

  // 3. 山脊：东北-西南隆起带（顶端标 high）
  for (let row = 5; row <= 30; row++) {
    const t = (row - 5) / 25;
    const centerCol = 70 - t * 30;
    for (let d = -3; d <= 3; d++) {
      const col = Math.round(centerCol + d);
      if (col < 0 || col >= cols) continue;
      if (water[row][col] > 0) continue;
      const dist = Math.abs(d);
      const heightBoost = dist <= 1 ? 0.30 : 0.15;
      height[row][col] = Math.min(1, height[row][col] + heightBoost);
      if (dist <= 1) natural[row][col] = NaturalTerrain.high;
    }
  }

  // 4. 盆地：圆形凹陷
  const basinCx = 40, basinCy = 42;
  for (let row = 35; row <= 50; row++) {
    for (let col = 30; col <= 50; col++) {
      if (water[row][col] > 0) continue;
      const dx = col - basinCx, dy = row - basinCy;
      const dist = Math.hypot(dx, dy);
      if (dist < 8) {
        const depth = 0.20 * (1 - dist / 8);
        height[row][col] = Math.max(0, height[row][col] - depth);
      }
    }
  }

  // 5. 高原：抬升区域（高海拔标 high）
  for (let row = 40; row <= 55; row++) {
    for (let col = 15; col <= 30; col++) {
      if (water[row][col] > 0) continue;
      const dx = col - 22.5, dy = row - 47.5;
      const dist = Math.hypot(dx / 8, dy / 6);
      if (dist < 1) {
        const elevation = 0.25 * (1 - dist * 0.3);
        height[row][col] = Math.min(1, height[row][col] + elevation);
        if (elevation > 0.15) natural[row][col] = NaturalTerrain.high;
      }
    }
  }
}
