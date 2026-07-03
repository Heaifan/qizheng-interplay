// ============================================================
// terrainSightFactor — 视线 / 命中地形系数
//
// 根据 SightSampleResult 计算视距和命中修正系数。
// 同类地形一条线内只计算一次。
// ============================================================

import type { SightSampleResult } from './terrainSightSample';

export function calcSightModifier(sight: SightSampleResult): number {
  if (sight.blockedByTerrain) return 0;
  let mod = 1.0;
  if (sight.touchesForest) mod *= 0.65;
  if (sight.touchesBush) mod *= 0.80;
  return mod;
}

export function calcHitModifier(sight: SightSampleResult): number {
  if (sight.blockedByTerrain) return 0;
  let mod = 1.0;
  if (sight.touchesForest) mod *= 0.70;
  if (sight.touchesBush) mod *= 0.85;
  return mod;
}
