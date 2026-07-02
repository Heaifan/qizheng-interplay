// ============================================================
// terrainCellQuery — 单格地形查询
//
// 提供指定网格或世界坐标处的地形信息查询。
// 所有外部系统必须通过此模块或 terrainQuery 门面访问，不得直接读数组。
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

// ─── 单格查询 ───────────────────────────────────────────────

/** 取得指定网格的完整地形信息 */
export function getCellInfo(
  map: BattleTerrainMap,
  col: number,
  row: number,
): TerrainCellInfo | null {
  if (!inBounds(map, col, row)) return null;

  const h = map.height[row][col];
  const nat = map.natural[row][col] as NaturalTerrain;
  const wat = map.water[row][col] as WaterTerrain;
  const veg = map.vegetation[row][col] as VegetationTerrain;

  const derived = deriveCellType(map, col, row, wat, h);

  return { col, row, height: h, natural: nat, water: wat, vegetation: veg, derived };
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

// ─── 图层快捷查询 ───────────────────────────────────────────

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

// ─── 内部辅助 ───────────────────────────────────────────────

const SLOPE_THRESHOLD = 0.06;

/**
 * 根据高度和水体自动判断该格的派生地貌类型。
 * 注：此函数是本地简易派发，全图派生应由 deriveTerrain() 统一计算后写入 derived 字段。
 */
function deriveCellType(
  map: BattleTerrainMap,
  col: number,
  row: number,
  water: number,
  h: number,
): DerivedTerrain {
  if (water > 0) return DerivedTerrain.none;

  const neighbors = [
    [col - 1, row], [col + 1, row],
    [col, row - 1], [col, row + 1],
  ];
  for (const [nc, nr] of neighbors) {
    if (!inBounds(map, nc, nr)) continue;
    if (Math.abs(h - map.height[nr][nc]) > SLOPE_THRESHOLD) {
      return DerivedTerrain.slope;
    }
  }

  if (map.natural[row][col] === NaturalTerrain.high) {
    return DerivedTerrain.high;
  }

  return DerivedTerrain.none;
}
