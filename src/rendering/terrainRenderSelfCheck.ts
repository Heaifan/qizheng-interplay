// ============================================================
// terrainRenderSelfCheck — 地形渲染自检
//
// 采集 BattleTerrainMap 的渲染相关信息并格式化输出。
// ============================================================

import type { BattleTerrainMap } from '@/domain/terrainMap';
import { WaterTerrain, VegetationTerrain, DerivedTerrain } from '@/domain/terrainMap';

export interface RenderCheckReport {
  cols: number;
  rows: number;
  totalCells: number;
  cellMeters: number;
  waterCells: number;
  vegetationCells: number;
  forestCells: number;
  bushCells: number;
  highCells: number;
  slopeCells: number;
  showTerrainMap: boolean;
}

export function buildRenderCheck(
  map: BattleTerrainMap,
  showTerrainMap: boolean,
): RenderCheckReport {
  let waterCells = 0, vegetationCells = 0, forestCells = 0, bushCells = 0;
  let highCells = 0, slopeCells = 0;

  for (let row = 0; row < map.rows; row++) {
    for (let col = 0; col < map.cols; col++) {
      if (map.water[row][col] > 0) waterCells++;
      const v = map.vegetation[row][col];
      if (v > 0) vegetationCells++;
      if (v === VegetationTerrain.forest) forestCells++;
      if (v === VegetationTerrain.bush) bushCells++;
      const d = map.derived;
      if (d?.high?.[row]?.[col]) highCells++;
      if (d?.slope?.[row]?.[col]) slopeCells++;
    }
  }

  return {
    cols: map.cols, rows: map.rows, totalCells: map.cols * map.rows,
    cellMeters: map.cellMeters,
    waterCells, vegetationCells, forestCells, bushCells,
    highCells, slopeCells,
    showTerrainMap,
  };
}

export function formatRenderCheck(r: RenderCheckReport): string {
  return [
    `[地形渲染自检]`,
    `━━━━━━━━━━━━━━━━`,
    `地图尺寸：${r.cols} × ${r.rows}`,
    `总格数：${r.totalCells}`,
    `单格：${r.cellMeters}m`,
    `水体格子：${r.waterCells}`,
    `植被格子：${r.vegetationCells}（森林${r.forestCells}/灌木${r.bushCells}）`,
    `高地区格子：${r.highCells}`,
    `坡地区格子：${r.slopeCells}`,
    `地形图显示：${r.showTerrainMap ? '开' : '关'}`,
  ].join('\n');
}
