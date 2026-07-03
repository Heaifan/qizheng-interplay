// ============================================================
// terrainMoveBlock — 地形移动阻挡判断
//
// 检查某格地形是否禁止单位进入。
// 当前规则：水体（river / lake）阻挡所有移动。
// ============================================================

import type { TerrainCellInfo } from '@/domain/terrainMap';

export function isMoveBlockedByTerrain(cell: TerrainCellInfo): boolean {
  return cell.water > 0;
}
