// ============================================================
// terrainSelfCheck — 地形数据自检
//
// 遍历 BattleTerrainMap 并输出统计学报告，用于验证
// 地图数据完整性、异常值检测、基本地貌统计。
//
// 使用方式：
//   const map = createFixtureTerrainMap();
//   const report = runTerrainSelfCheck(map);
//   console.log(report);
// ============================================================

import {
  type BattleTerrainMap,
  NaturalTerrain,
  WaterTerrain,
  VegetationTerrain,
  DerivedTerrain,
} from './terrainMap';
import { getCellInfo, inBounds } from './terrainQuery';

/** 自检报告 */
export interface TerrainSelfCheckReport {
  /** 地图标识 */
  label: string;

  /** 基础信息 */
  cols: number;
  rows: number;
  totalCells: number;
  cellMeters: number;

  /** 高度统计 */
  heightMin: number;
  heightMax: number;
  heightAvg: number;

  /** 地貌统计 */
  waterCells: number;
  vegetationCells: number;
  forestCells: number;
  bushCells: number;

  /** 派生地貌统计 */
  highCells: number;
  slopeCells: number;
  lowCells: number;

  /** 异常 */
  invalidCells: number;
  heightOutOfRange: number;
  orphanHighCells: number; // 高地上有水（逻辑冲突）

  /** 是否通过基础自检 */
  passed: boolean;
}

/**
 * 执行地图自检
 * @param map    待检地图
 * @param label  标识名称（用于输出）
 */
export function runTerrainSelfCheck(
  map: BattleTerrainMap,
  label: string = 'BattleTerrainMap',
): TerrainSelfCheckReport {
  const totalCells = map.cols * map.rows;

  let heightSum = 0;
  let heightMin = Infinity;
  let heightMax = -Infinity;

  let waterCells = 0;
  let vegetationCells = 0;
  let forestCells = 0;
  let bushCells = 0;
  let highCells = 0;
  let slopeCells = 0;
  let lowCells = 0;

  let invalidCells = 0;
  let heightOutOfRange = 0;
  let orphanHighCells = 0;

  for (let row = 0; row < map.rows; row++) {
    for (let col = 0; col < map.cols; col++) {
      // 检查数组存在性
      if (!map.height[row]?.[col] === undefined) {
        invalidCells++;
        continue;
      }

      const h = map.height[row][col];

      // 高度范围
      if (h < 0 || h > 1) {
        heightOutOfRange++;
      }
      if (h < heightMin) heightMin = h;
      if (h > heightMax) heightMax = h;
      heightSum += h;

      // 水体
      const w = map.water[row]?.[col] ?? 0;
      if (w > 0) waterCells++;

      // 植被
      const v = map.vegetation[row]?.[col] ?? 0;
      if (v > 0) vegetationCells++;
      if (v === VegetationTerrain.forest) forestCells++;
      if (v === VegetationTerrain.bush) bushCells++;

      // 逻辑冲突：高地上有水
      const nat = map.natural[row]?.[col] ?? 0;
      if (nat === NaturalTerrain.high && w > 0) orphanHighCells++;

      // 派生地貌
      const info = getCellInfo(map, col, row);
      if (info) {
        if (info.derived === DerivedTerrain.high) highCells++;
        if (info.derived === DerivedTerrain.slope) slopeCells++;
        if (info.derived === DerivedTerrain.low) lowCells++;
      }
    }
  }

  const heightAvg = totalCells > 0 ? heightSum / totalCells : 0;

  const passed =
    heightOutOfRange === 0 &&
    invalidCells === 0 &&
    orphanHighCells === 0 &&
    map.cols > 0 &&
    map.rows > 0;

  return {
    label,
    cols: map.cols,
    rows: map.rows,
    totalCells,
    cellMeters: map.cellMeters,
    heightMin,
    heightMax,
    heightAvg,
    waterCells,
    vegetationCells,
    forestCells,
    bushCells,
    highCells,
    slopeCells,
    lowCells,
    invalidCells,
    heightOutOfRange,
    orphanHighCells,
    passed,
  };
}

/**
 * 格式化为可读字符串
 */
export function formatSelfCheckReport(report: TerrainSelfCheckReport): string {
  const lines: string[] = [
    `[地形自检] ${report.label}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `尺寸：${report.cols} × ${report.rows}`,
    `总格数：${report.totalCells}`,
    `单格：${report.cellMeters}m`,
    ``,
    `高度范围：${report.heightMin.toFixed(3)} - ${report.heightMax.toFixed(3)}`,
    `高度均值：${report.heightAvg.toFixed(3)}`,
    ``,
    `水体格子：${report.waterCells}`,
    `植被格子：${report.vegetationCells}`,
    `  其中森林：${report.forestCells}`,
    `  其中灌木：${report.bushCells}`,
    `高地区格子：${report.highCells}`,
    `坡地区格子：${report.slopeCells}`,
    `低地区格子：${report.lowCells}`,
    ``,
    `异常格子：${report.invalidCells}`,
    `高度越界：${report.heightOutOfRange}`,
    `逻辑冲突：${report.orphanHighCells}`,
    ``,
    `自检结果：${report.passed ? '✅ 通过' : '❌ 失败'}`,
  ];

  return lines.join('\n');
}
