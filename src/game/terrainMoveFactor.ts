// ============================================================
// terrainMoveFactor — 地形移动速度系数
//
// 根据 TerrainCellInfo 计算地形对移动速度的修正系数。
// 系数范围 [0, 1]，1.0 = 无影响。
// ============================================================

import type { TerrainCellInfo } from '@/domain/terrainMap';
import { NaturalTerrain, VegetationTerrain, DerivedTerrain } from '@/domain/terrainMap';

const BASE_SPEED = 1.0;
const FACTORS: Record<string, number> = {
  grass: BASE_SPEED,
  dirt: 0.85,
  high: 0.90,
  forest: 0.65,
  bush: 0.80,
  slope: 0.75,
};

export function calcMoveFactor(cell: TerrainCellInfo): number {
  let factor = BASE_SPEED;

  // natural terrain
  if (cell.natural === NaturalTerrain.dirt) factor *= FACTORS.dirt;
  else if (cell.natural === NaturalTerrain.high) factor *= FACTORS.high;

  // vegetation
  if (cell.vegetation === VegetationTerrain.forest) factor *= FACTORS.forest;
  else if (cell.vegetation === VegetationTerrain.bush) factor *= FACTORS.bush;

  // derived slope
  if (cell.derived === DerivedTerrain.slope) factor *= FACTORS.slope;

  // water is handled by terrainMoveBlock
  return factor;
}
