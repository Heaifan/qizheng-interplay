// ============================================================
// terrainCellInfo — 单格地形信息查询
//
// 提供指定网格或世界坐标处的完整地形信息。
// derived 优先读预计算 map.derived（deriveTerrain 填充），
// 缺省回退实时 computeDerivedAt。
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
import { computeDerivedAt, reconstructDerived } from './terrainDerive';

/** 取得指定网格的完整地形信息 */
export function getCellInfo(
  map: BattleTerrainMap,
  col: number,
  row: number,
): TerrainCellInfo | null {
  if (!inBounds(map, col, row)) return null;
  const h = map.height[row][col];
  const derived = map.derived
    ? reconstructDerived(map.derived, row, col)
    : computeDerivedAt(map, col, row);
  return {
    col, row,
    height: h,
    natural: map.natural[row][col] as NaturalTerrain,
    water: map.water[row][col] as WaterTerrain,
    vegetation: map.vegetation[row][col] as VegetationTerrain,
    derived,
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
