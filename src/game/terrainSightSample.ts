// ============================================================
// terrainSightSample — 视线 / 射线段地形采样
//
// 采样 observer→target 线段，判断经过的地形和高度遮挡。
// ============================================================

import type { BattleTerrainMap } from '@/domain/terrainMap';
import { NaturalTerrain, VegetationTerrain, DerivedTerrain } from '@/domain/terrainMap';
import { sampleSegmentTerrain, getCellInfo } from '@/domain/terrainQuery';

const HEIGHT_BLOCK_MARGIN = 0.08;

export interface SightSampleResult {
  count: number;
  touchesForest: boolean;
  touchesBush: boolean;
  touchesHigh: boolean;
  touchesSlope: boolean;
  touchesWater: boolean;
  blockedByTerrain: boolean;
}

export function sampleSightLine(
  map: BattleTerrainMap,
  x1: number, y1: number,
  x2: number, y2: number,
): SightSampleResult {
  const seg = sampleSegmentTerrain(map, x1, y1, x2, y2, true);
  let touchesBush = false;
  let hasBlockingHigh = false;

  for (const d of seg.detail ?? []) {
    const info = getCellInfo(map, d.col, d.row);
    if (!info) continue;
    if (info.vegetation === VegetationTerrain.bush) touchesBush = true;

    // height-based blocking: if a mid-point is significantly higher than the sight line
    if (info.derived === DerivedTerrain.high || info.derived === DerivedTerrain.slope) {
      const t = Math.hypot(d.col * map.cellMeters - x1, d.row * map.cellMeters - y1) /
               Math.hypot(x2 - x1, y2 - y1);
      const lineH = (1 - t) * map.height[Math.round(y1 / map.cellMeters)]?.[Math.round(x1 / map.cellMeters)]
                  + t * map.height[Math.round(y2 / map.cellMeters)]?.[Math.round(x2 / map.cellMeters)];
      if (info.height > lineH + HEIGHT_BLOCK_MARGIN) hasBlockingHigh = true;
    }
  }

  return {
    count: seg.count,
    touchesForest: seg.touchesForest,
    touchesBush,
    touchesHigh: seg.highCells > 0,
    touchesSlope: seg.slopeCells > 0,
    touchesWater: seg.touchesWater,
    blockedByTerrain: hasBlockingHigh,
  };
}
