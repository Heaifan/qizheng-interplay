// ============================================================
// terrainCellInfo — 单格地形信息查询
//
// 提供指定网格或世界坐标处的完整地形信息。
// ============================================================

import {
  type BattleTerrainMap,
  type TerrainCellInfo,
  NaturalTerrain,
  WaterTerrain,
  VegetationTerrain,
  DerivedTerrain,
} from '../terrainMap';
import { worldToCell, inBounds } from './terrainCoord';

const SLOPE_THRESHOLD = 0.06;

function deriveCellType(
  map: BattleTerrainMap,
  col: number,
  row: number,
  water: number,
  h: number,
): DerivedTerrain {
  if (water > 0) return DerivedTerrain.none;
  const neighbors = [[col - 1, row], [col + 1, row], [col, row - 1], [col, row + 1]];
  for (const [nc, nr] of neighbors) {
    if (!inBounds(map, nc, nr)) continue;
    if (Math.abs(h - map.height[nr][nc]) > SLOPE_THRESHOLD) return DerivedTerrain.slope;
  }
  if (map.natural[row][col] === NaturalTerrain.high) return DerivedTerrain.high;
  return DerivedTerrain.none;
}

/** 取得指定网格的完整地形信息 */
export function getCellInfo(
  map: BattleTerrainMap,
  col: number,
  row: number,
): TerrainCellInfo | null {
  if (!inBounds(map, col, row)) return null;
  const h = map.height[row][col];
  return {
    col, row,
    height: h,
    natural: map.natural[row][col] as NaturalTerrain,
    water: map.water[row][col] as WaterTerrain,
    vegetation: map.vegetation[row][col] as VegetationTerrain,
    derived: deriveCellType(map, col, row, map.water[row][col], h),
  };
}

/** 世界坐标 → 完整地形信息 */
export function getTerrainCell(
  map: BattleTerrainMap,
  wx: number,
  wy: number,
): TerrainCellInfo | null {
  const cell = worldToCell(map, wx, wy);
  if (!cell) return null;
  return getCellInfo(map, cell.col, cell.row);
}
