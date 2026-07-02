// ============================================================
// formatTerrainSelfCheck — 自检报告格式化
//
// 将 TerrainStats + ShapeCheckResult 合并格式化为可读字符串。
// 不含统计或校验逻辑。
// ============================================================

import type { TerrainStats } from './terrainStats';
import type { ShapeCheckResult } from './terrainShapeCheck';

export interface FormattedReport {
  label: string;
  stats: TerrainStats;
  shapeCheck: ShapeCheckResult;
}

/**
 * 格式化为可读字符串
 */
export function formatSelfCheckReport(report: FormattedReport): string {
  const { label, stats, shapeCheck } = report;
  const lines: string[] = [
    `[地形自检] ${label}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `尺寸：${stats.cols} × ${stats.rows}`,
    `总格数：${stats.totalCells}`,
    `单格：${stats.cellMeters}m`,
    ``,
    `高度范围：${stats.heightMin.toFixed(3)} - ${stats.heightMax.toFixed(3)}`,
    `高度均值：${stats.heightAvg.toFixed(3)}`,
    ``,
    `水体格子：${stats.waterCells}`,
    `植被格子：${stats.vegetationCells}`,
    `  其中森林：${stats.forestCells}`,
    `  其中灌木：${stats.bushCells}`,
    `高地区格子：${stats.highCells}`,
    `坡地区格子：${stats.slopeCells}`,
    `低地区格子：${stats.lowCells}`,
    ``,
    `异常格子：${stats.invalidCells}`,
    `高度越界：${stats.heightOutOfRange}`,
    `逻辑冲突：${stats.orphanHighCells}`,
  ];

  // 图层尺寸校验结果
  if (shapeCheck.mismatchCount > 0) {
    lines.push(`图层尺寸异常：${shapeCheck.mismatchCount}`);
    for (const l of shapeCheck.layers) {
      if (!l.ok) {
        lines.push(`  ❌ ${l.name}: 期望 ${l.expectedRows}×${l.expectedCols}，实际 ${l.actualRows}×${l.actualCols}`);
      }
    }
  } else {
    lines.push(`图层尺寸异常：0`);
  }

  lines.push(
    ``,
    `自检结果：${stats.passed && shapeCheck.mismatchCount === 0 ? '✅ 通过' : '❌ 失败'}`,
  );

  return lines.join('\n');
}
