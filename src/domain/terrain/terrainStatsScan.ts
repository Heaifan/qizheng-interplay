// ============================================================
// terrainStatsScan — 地图统计扫描
//
// 遍历 BattleTerrainMap 收集统计原始数据。
// ============================================================

import {
  type BattleTerrainMap,
  NaturalTerrain,
  VegetationTerrain,
  DerivedTerrain,
} from '../terrainMap';
import { getCellInfo } from './terrainCellQuery';

export interface RawCounts {
  heightSum: number;
  heightMin: number;
  heightMax: number;
  waterCells: number;
  vegetationCells: number;
  forestCells: number;
  bushCells: number;
  highCells: number;
  slopeCells: number;
  lowCells: number;
  invalidCells: number;
  heightOutOfRange: number;
  orphanHighCells: number;
}

export function scanRawCounts(map: BattleTerrainMap): RawCounts {
  let heightSum = 0, heightMin = Infinity, heightMax = -Infinity;
  let waterCells = 0, vegetationCells = 0, forestCells = 0, bushCells = 0;
  let highCells = 0, slopeCells = 0, lowCells = 0;
  let invalidCells = 0, heightOutOfRange = 0, orphanHighCells = 0;

  for (let row = 0; row < map.rows; row++) {
    for (let col = 0; col < map.cols; col++) {
      if (!map.height[row]?.[col] === undefined) { invalidCells++; continue; }
      const h = map.height[row][col];
      if (h < 0 || h > 1) heightOutOfRange++;
      if (h < heightMin) heightMin = h;
      if (h > heightMax) heightMax = h;
      heightSum += h;

      const w = map.water[row]?.[col] ?? 0;
      if (w > 0) waterCells++;
      const v = map.vegetation[row]?.[col] ?? 0;
      if (v > 0) vegetationCells++;
      if (v === VegetationTerrain.forest) forestCells++;
      if (v === VegetationTerrain.bush) bushCells++;
      const nat = map.natural[row]?.[col] ?? 0;
      if (nat === NaturalTerrain.high && w > 0) orphanHighCells++;

      const info = getCellInfo(map, col, row);
      if (!info) continue;
      if (info.derived === DerivedTerrain.high) highCells++;
      if (info.derived === DerivedTerrain.slope) slopeCells++;
      if (info.derived === DerivedTerrain.low) lowCells++;
    }
  }
  return { heightSum, heightMin, heightMax, waterCells, vegetationCells, forestCells, bushCells, highCells, slopeCells, lowCells, invalidCells, heightOutOfRange, orphanHighCells };
}
