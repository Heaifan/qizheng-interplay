// ============================================================
// terrainMoveSample — 移动路径段地形采样
//
// 采样当前位置到下一点之间的整段路径，判断水体阻挡
// 和各类地形对速度系数的综合影响。
// ============================================================

import type { BattleTerrainMap } from '@/domain/terrainMap';
import { NaturalTerrain, VegetationTerrain, DerivedTerrain } from '@/domain/terrainMap';
import { sampleSegmentTerrain, getCellInfo } from '@/domain/terrainQuery';

export interface MoveSegmentResult {
  blocked: boolean;
  factor: number;
  count: number;
  touchesWater: boolean;
  touchesForest: boolean;
  hasSlope: boolean;
  hasHigh: boolean;
  hasDirt: boolean;
  hasBush: boolean;
}

export function sampleMoveSegment(
  map: BattleTerrainMap,
  x1: number, y1: number,
  x2: number, y2: number,
): MoveSegmentResult {
  const seg = sampleSegmentTerrain(map, x1, y1, x2, y2, true);
  let hasDirt = false, hasBush = false;
  let hasSlope = false, hasHigh = false;

  for (const d of seg.detail ?? []) {
    const info = getCellInfo(map, d.col, d.row);
    if (!info) continue;
    if (info.natural === NaturalTerrain.dirt) hasDirt = true;
    if (info.vegetation === VegetationTerrain.bush) hasBush = true;
    if (info.derived === DerivedTerrain.slope) hasSlope = true;
    if (info.derived === DerivedTerrain.high) hasHigh = true;
  }

  let factor = 1.0;
  if (seg.touchesWater) return { blocked: true, factor: 0, count: seg.count, touchesWater: true, touchesForest: seg.touchesForest, hasSlope, hasHigh, hasDirt, hasBush };
  if (hasDirt) factor *= 0.85;
  if (hasHigh) factor *= 0.90;
  if (seg.touchesForest) factor *= 0.65;
  if (hasBush) factor *= 0.80;
  if (hasSlope) factor *= 0.75;

  return { blocked: false, factor, count: seg.count, touchesWater: false, touchesForest: seg.touchesForest, hasSlope, hasHigh, hasDirt, hasBush };
}
