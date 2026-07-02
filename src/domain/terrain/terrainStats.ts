// ============================================================
// terrainStats — 地形统计学扫描
//
// 遍历 BattleTerrainMap 并统计各类地貌格数、高度范围、
// 异常值数量。纯扫描，不含格式化输出。
// ============================================================

import {
  type BattleTerrainMap,
  NaturalTerrain,
  VegetationTerrain,
  DerivedTerrain,
} from '../terrainMap';
import { getCellInfo } from './terrainCellQuery';

/** 自检报告数据结构 */
export interface TerrainStats {
  cols: number;
  rows: number;
  totalCells: number;
  cellMeters: number;

  heightMin: number;
  heightMax: number;
  heightAvg: number;

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

  passed: boolean;
}

/**
 * 扫描地图并收集统计数据
 */
export function scanTerrainStats(map: BattleTerrainMap): TerrainStats {
  const totalCells = map.cols * map.rows;

  let heightSum = 0;
  let heightMin = Infinity;
  let heightMax = -Infinity;

  let waterCells = 0;
  let vegetationCells = 0;
  let forestCells = 0;
  let bushCells = 0;
  let highCells = 0;
  let slopeCells = 0;
  let lowCells = 0;

  let invalidCells = 0;
  let heightOutOfRange = 0;
  let orphanHighCells = 0;

  for (let row = 0; row < map.rows; row++) {
    for (let col = 0; col < map.cols; col++) {
      if (!map.height[row]?.[col] === undefined) {
        invalidCells++;
        continue;
      }

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
      if (info) {
        if (info.derived === DerivedTerrain.high) highCells++;
        if (info.derived === DerivedTerrain.slope) slopeCells++;
        if (info.derived === DerivedTerrain.low) lowCells++;
      }
    }
  }

  const heightAvg = totalCells > 0 ? heightSum / totalCells : 0;

  const passed =
    heightOutOfRange === 0 &&
    invalidCells === 0 &&
    orphanHighCells === 0 &&
    map.cols > 0 &&
    map.rows > 0;

  return {
    cols: map.cols,
    rows: map.rows,
    totalCells,
    cellMeters: map.cellMeters,
    heightMin: heightMin === Infinity ? 0 : heightMin,
    heightMax: heightMax === -Infinity ? 0 : heightMax,
    heightAvg,
    waterCells,
    vegetationCells,
    forestCells,
    bushCells,
    highCells,
    slopeCells,
    lowCells,
    invalidCells,
    heightOutOfRange,
    orphanHighCells,
    passed,
  };
}
