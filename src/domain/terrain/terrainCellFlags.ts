// ============================================================
// terrainCellFlags — 单格地形标志查询
//
// 图层快捷查询：高度、水体、森林、高地。
// ============================================================

import { type BattleTerrainMap, NaturalTerrain, VegetationTerrain } from '../terrainMap';
import { worldToCell } from './terrainCoord';

/** 世界坐标处的高度 */
export function getHeightAt(map: BattleTerrainMap, wx: number, wy: number): number | null {
  const cell = worldToCell(map, wx, wy);
  if (!cell) return null;
  return map.height[cell.row][cell.col];
}

/** 世界坐标处是否有水体 */
export function isWaterAt(map: BattleTerrainMap, wx: number, wy: number): boolean {
  const cell = worldToCell(map, wx, wy);
  if (!cell) return false;
  return map.water[cell.row][cell.col] > 0;
}

/** 世界坐标处是否有森林 */
export function isForestAt(map: BattleTerrainMap, wx: number, wy: number): boolean {
  const cell = worldToCell(map, wx, wy);
  if (!cell) return false;
  return map.vegetation[cell.row][cell.col] === VegetationTerrain.forest;
}

/** 世界坐标处是否为高地 */
export function isHighAt(map: BattleTerrainMap, wx: number, wy: number): boolean {
  const cell = worldToCell(map, wx, wy);
  if (!cell) return false;
  return map.natural[cell.row][cell.col] === NaturalTerrain.high;
}
