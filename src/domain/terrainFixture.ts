// ============================================================
// terrainFixture — 内置测试地图
//
// 生成一张 96×64、cellMeters=10 的标准测试图，
// 包含河流、树林、山脊、盆地、高原等典型地貌，
// 用于验证 BattleTerrainMap 数据结构及 terrainQuery 查询。
//
// 此地图不接编辑器导出，仅供开发阶段自检和调试。
// ============================================================

import {
  type BattleTerrainMap,
  NaturalTerrain,
  WaterTerrain,
  VegetationTerrain,
} from './terrainMap';

/**
 * 生成内置测试地图
 *   cols = 96, rows = 64, cellMeters = 10
 */
export function createFixtureTerrainMap(): BattleTerrainMap {
  const cols = 96;
  const rows = 64;
  const cellMeters = 10;

  // height: 默认 0.45，后续按地貌覆盖
  const height: number[][] = Array.from(
    { length: rows },
    () => Array(cols).fill(0.45),
  );

  const natural: number[][] = Array.from(
    { length: rows },
    () => Array(cols).fill(NaturalTerrain.grass),
  );

  const water: number[][] = Array.from(
    { length: rows },
    () => Array(cols).fill(WaterTerrain.none),
  );

  const vegetation: number[][] = Array.from(
    { length: rows },
    () => Array(cols).fill(VegetationTerrain.none),
  );

  // ──────────────────────────────────────────────────────────
  // 1. 河床 (先挖低，再铺水)
  //    一条从 (10, 0) 蜿蜒到 (80, 63) 的河流，宽度 2~3 格
  // ──────────────────────────────────────────────────────────
  for (let row = 0; row < rows; row++) {
    const t = row / rows;
    const center = 10 + t * 70 + Math.sin(t * Math.PI * 3) * 15;
    const halfWidth = 1.5 + Math.sin(t * Math.PI * 2) * 0.5;
    for (let d = -Math.ceil(halfWidth); d <= Math.ceil(halfWidth); d++) {
      const col = Math.round(center + d);
      if (col < 0 || col >= cols) continue;
      const dist = Math.abs(d);
      // 河床地形：中心深 (-0.25)，边缘浅 (-0.10)
      const depth = dist <= 1 ? -0.25 : -0.10;
      height[row][col] = Math.max(0, 0.45 + depth);
      water[row][col] = WaterTerrain.river;
      // 河床上不允许有其他植被
      vegetation[row][col] = VegetationTerrain.none;
      natural[row][col] = NaturalTerrain.grass;
    }
  }

  // ──────────────────────────────────────────────────────────
  // 2. 森林: 两片 — 左上方块林 + 右下半月林
  // ──────────────────────────────────────────────────────────
  // 2a. 方块林 (col 5~20, row 5~18)
  for (let row = 5; row <= 18; row++) {
    for (let col = 5; col <= 20; col++) {
      if (water[row][col] > 0) continue; // 水面不种树
      vegetation[row][col] = VegetationTerrain.forest;
      // 林下地面略低 (树荫)
      height[row][col] = Math.max(0, height[row][col] - 0.02);
    }
  }

  // 2b. 半月林 (col 55~75, row 35~50, 半月形)
  for (let row = 35; row <= 50; row++) {
    for (let col = 55; col <= 75; col++) {
      if (water[row][col] > 0) continue;
      const cx = 65, cy = 42;
      const dx = col - cx, dy = row - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < 10 && dy > -3) {
        vegetation[row][col] = VegetationTerrain.forest;
        height[row][col] = Math.max(0, height[row][col] - 0.02);
      }
    }
  }

  // ──────────────────────────────────────────────────────────
  // 3. 山脊: 一条东北-西南走向的隆起带
  //    从 (70, 5) 到 (40, 30)
  // ──────────────────────────────────────────────────────────
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
      // 山脊顶端标记为 high
      if (dist <= 1) {
        natural[row][col] = NaturalTerrain.high;
      }
    }
  }

  // ──────────────────────────────────────────────────────────
  // 4. 盆地: 一个圆形凹陷区域 (col 30~50, row 35~50)
  // ──────────────────────────────────────────────────────────
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

  // ──────────────────────────────────────────────────────────
  // 5. 高原: 一片抬升区域 (col 15~30, row 40~55)
  // ──────────────────────────────────────────────────────────
  for (let row = 40; row <= 55; row++) {
    for (let col = 15; col <= 30; col++) {
      if (water[row][col] > 0) continue;
      const dx = col - 22.5, dy = row - 47.5;
      const dist = Math.hypot(dx / 8, dy / 6);
      if (dist < 1) {
        const elevation = 0.25 * (1 - dist * 0.3);
        height[row][col] = Math.min(1, height[row][col] + elevation);
        if (elevation > 0.15) {
          natural[row][col] = NaturalTerrain.high;
        }
      }
    }
  }

  // ──────────────────────────────────────────────────────────
  // 返回构造完成的地图
  // ──────────────────────────────────────────────────────────
  return {
    version: 'qz-terrain-v1',
    cols,
    rows,
    cellMeters,
    height,
    natural,
    water,
    vegetation,
  };
}
