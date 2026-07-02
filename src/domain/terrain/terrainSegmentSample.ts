// ============================================================
// terrainSegmentSample — 线段地形采样
//
// 沿线段步进采样地形，返回经过的格数、统计和触碰标志。
// 步长 = cellMeters，保证不会跳过窄地形。
// 数学辅助见 terrainSegmentMath。
// ============================================================

import {
  type BattleTerrainMap,
  NaturalTerrain,
  VegetationTerrain,
  DerivedTerrain,
} from '../terrainMap';
import { worldToCell } from './terrainCoord';
import { getCellInfo } from './terrainCellQuery';
import { segmentDist, sampleSteps, lerpPoint, cellKey } from './terrainSegmentMath';

export interface SegmentSample {
  count: number;
  waterCells: number;
  forestCells: number;
  highCells: number;
  slopeCells: number;
  minHeight: number;
  maxHeight: number;
  touchesWater: boolean;
  touchesForest: boolean;
  detail?: Array<{ col: number; row: number; height: number; flags: string }>;
}

export function sampleSegmentTerrain(
  map: BattleTerrainMap,
  x1: number, y1: number, x2: number, y2: number,
  includeDetail: boolean = false,
): SegmentSample {
  const dist = segmentDist(x1, y1, x2, y2);
  const steps = sampleSteps(dist, map.cellMeters);
  let waterCells = 0, forestCells = 0, highCells = 0, slopeCells = 0;
  let minHeight = Infinity, maxHeight = -Infinity;
  const seen = new Set<number>();
  const detail: SegmentSample['detail'] = [];

  for (let i = 0; i <= steps; i++) {
    const t = steps > 0 ? i / steps : 0;
    const p = lerpPoint(x1, y1, x2, y2, t);
    const cell = worldToCell(map, p.x, p.y);
    if (!cell) continue;

    const key = cellKey(cell.col, cell.row, map.cols);
    if (seen.has(key)) continue;
    seen.add(key);

    const info = getCellInfo(map, cell.col, cell.row);
    if (!info) continue;

    minHeight = Math.min(minHeight, info.height);
    maxHeight = Math.max(maxHeight, info.height);
    if (info.water > 0) waterCells++;
    if (info.vegetation === VegetationTerrain.forest) forestCells++;
    if (info.natural === NaturalTerrain.high) highCells++;
    if (info.derived === DerivedTerrain.slope) slopeCells++;

    if (includeDetail) {
      const flags: string[] = [];
      if (info.water > 0) flags.push('W');
      if (info.vegetation === VegetationTerrain.forest) flags.push('F');
      if (info.natural === NaturalTerrain.high) flags.push('H');
      if (info.derived === DerivedTerrain.slope) flags.push('S');
      detail.push({ col: cell.col, row: cell.row, height: info.height, flags: flags.join('') || '-' });
    }
  }

  return {
    count: seen.size, waterCells, forestCells, highCells, slopeCells,
    minHeight: minHeight === Infinity ? 0 : minHeight,
    maxHeight: maxHeight === -Infinity ? 0 : maxHeight,
    touchesWater: waterCells > 0, touchesForest: forestCells > 0,
    ...(includeDetail ? { detail } : {}),
  };
}
