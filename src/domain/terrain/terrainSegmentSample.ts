// ============================================================
// terrainSegmentSample — 线段地形采样
//
// 沿线段步进采样地形，返回经过的格数、统计和触碰标志。
// 步长 = cellMeters，保证不会跳过窄地形。
// ============================================================

import {
  type BattleTerrainMap,
  NaturalTerrain,
  VegetationTerrain,
  DerivedTerrain,
} from '../terrainMap';
import { worldToCell } from './terrainCoord';
import { getCellInfo } from './terrainCellQuery';

/** 线段采样结果 */
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

/**
 * 沿线段采样地形，返回步进统计结果。
 * 采样步长 = map.cellMeters（每格一步），确保不会跳过窄地形。
 */
export function sampleSegmentTerrain(
  map: BattleTerrainMap,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  includeDetail: boolean = false,
): SegmentSample {
  const step = map.cellMeters;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / step));

  let waterCells = 0;
  let forestCells = 0;
  let highCells = 0;
  let slopeCells = 0;
  let minHeight = Infinity;
  let maxHeight = -Infinity;

  const seen = new Set<number>();
  const detail: SegmentSample['detail'] = [];

  for (let i = 0; i <= steps; i++) {
    const t = steps > 0 ? i / steps : 0;
    const wx = x1 + dx * t;
    const wy = y1 + dy * t;
    const cell = worldToCell(map, wx, wy);
    if (!cell) continue;

    const key = cell.col + cell.row * map.cols;
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
      detail.push({
        col: cell.col,
        row: cell.row,
        height: info.height,
        flags: flags.join('') || '-',
      });
    }
  }

  return {
    count: seen.size,
    waterCells,
    forestCells,
    highCells,
    slopeCells,
    minHeight: minHeight === Infinity ? 0 : minHeight,
    maxHeight: maxHeight === -Infinity ? 0 : maxHeight,
    touchesWater: waterCells > 0,
    touchesForest: forestCells > 0,
    ...(includeDetail ? { detail } : {}),
  };
}
