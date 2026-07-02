// ============================================================
// terrainCoord — 坐标换算
//
// 世界坐标 ↔ 网格坐标的双向换算，所有越界检查在此收敛。
// ============================================================

import type { BattleTerrainMap } from '../terrainMap';

/** 世界坐标 → 网格列号（向下取整，越界返回 -1） */
export function worldToCol(map: BattleTerrainMap, wx: number): number {
  const col = Math.floor(wx / map.cellMeters);
  return col >= 0 && col < map.cols ? col : -1;
}

/** 世界坐标 → 网格行号（向下取整，越界返回 -1） */
export function worldToRow(map: BattleTerrainMap, wy: number): number {
  const row = Math.floor(wy / map.cellMeters);
  return row >= 0 && row < map.rows ? row : -1;
}

/** 网格坐标 → 世界坐标（格子中心） */
export function cellToWorld(
  map: BattleTerrainMap,
  col: number,
  row: number,
): { x: number; y: number } {
  return {
    x: col * map.cellMeters + map.cellMeters / 2,
    y: row * map.cellMeters + map.cellMeters / 2,
  };
}

/** 世界坐标 → 网格坐标（越界返回 null） */
export function worldToCell(
  map: BattleTerrainMap,
  wx: number,
  wy: number,
): { col: number; row: number } | null {
  const col = worldToCol(map, wx);
  const row = worldToRow(map, wy);
  if (col < 0 || row < 0) return null;
  return { col, row };
}

/** 网格边界检查 */
export function inBounds(map: BattleTerrainMap, col: number, row: number): boolean {
  return col >= 0 && col < map.cols && row >= 0 && row < map.rows;
}
