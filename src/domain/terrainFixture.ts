// ============================================================
// terrainFixture — 内置测试地图入口
//
// 生成 96×64、cellMeters=10 的标准测试图（河流/森林/山脊/盆地/高原）。
// 调用 buildFixtureLayers 铺设地貌，并由 deriveTerrain 填充派生地形，
// 使 fixture 初始化后直接携带 derived 数据（T5-R1-B P0-2）。
// 本文件仅做装配，保持 ≤100 行；地貌绘制见 terrainFixture* 系列。
// ============================================================

import { type BattleTerrainMap } from './terrainMap';
import { deriveTerrain } from './terrain/terrainDerive';
import { buildFixtureLayers } from './terrainFixtureBuild';

export function createFixtureTerrainMap(): BattleTerrainMap {
  const cols = 96;
  const rows = 64;
  const cellMeters = 10;

  const height: number[][] = Array.from(
    { length: rows },
    () => Array(cols).fill(0.45),
  );
  const natural: number[][] = Array.from(
    { length: rows },
    () => Array(cols).fill(0),
  );
  const water: number[][] = Array.from(
    { length: rows },
    () => Array(cols).fill(0),
  );
  const vegetation: number[][] = Array.from(
    { length: rows },
    () => Array(cols).fill(0),
  );

  const map: BattleTerrainMap = {
    version: 'qz-terrain-v1',
    cols, rows, cellMeters,
    height, natural, water, vegetation,
  };

  buildFixtureLayers(map);
  return deriveTerrain(map);
}
