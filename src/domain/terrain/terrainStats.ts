// ============================================================
// terrainStats — 地形统计学扫描（入口）
//
// 聚合 terrainStatsScan + terrainStatsTypes。
// ============================================================

import type { BattleTerrainMap } from '../terrainMap';
import { scanRawCounts } from './terrainStatsScan';
import type { TerrainStats } from './terrainStatsTypes';

export type { TerrainStats } from './terrainStatsTypes';

export function scanTerrainStats(map: BattleTerrainMap): TerrainStats {
  const totalCells = map.cols * map.rows;
  const r = scanRawCounts(map);
  const heightAvg = totalCells > 0 ? r.heightSum / totalCells : 0;
  const passed = r.heightOutOfRange === 0 && r.invalidCells === 0 && r.orphanHighCells === 0 && map.cols > 0 && map.rows > 0;

  return {
    cols: map.cols, rows: map.rows, totalCells, cellMeters: map.cellMeters,
    heightMin: r.heightMin === Infinity ? 0 : r.heightMin,
    heightMax: r.heightMax === -Infinity ? 0 : r.heightMax,
    heightAvg, waterCells: r.waterCells, vegetationCells: r.vegetationCells,
    forestCells: r.forestCells, bushCells: r.bushCells,
    highCells: r.highCells, slopeCells: r.slopeCells, lowCells: r.lowCells,
    invalidCells: r.invalidCells, heightOutOfRange: r.heightOutOfRange,
    orphanHighCells: r.orphanHighCells, passed,
  };
}
