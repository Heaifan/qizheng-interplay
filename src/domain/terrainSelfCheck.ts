// ============================================================
// terrainSelfCheck — 地形数据自检（入口门面）
//
// 组织 terrainStats（统计）+ terrainShapeCheck（尺寸校验）
// + formatTerrainSelfCheck（格式化输出）。
//
// 使用方式：
//   const map = createFixtureTerrainMap();
//   const report = runTerrainSelfCheck(map);
//   console.log(report);
// ============================================================

import type { BattleTerrainMap } from './terrainMap';
import { scanTerrainStats } from './terrain/terrainStats';
import type { TerrainStats as _TerrainStats } from './terrain/terrainStats';
import { checkLayerShapes } from './terrain/terrainShapeCheck';
import type { ShapeCheckResult } from './terrain/terrainShapeCheck';
import { formatSelfCheckReport } from './terrain/formatTerrainSelfCheck';

/** 兼容旧类型名 — @deprecated 使用 TerrainStats 代替 */
export type TerrainSelfCheckReport = _TerrainStats;
export type { _TerrainStats as TerrainStats }; // 允许外部按新名导入

/**
 * 执行地图自检：统计 + 图层尺寸校验 + 格式化
 * @param map    待检地图
 * @param label  标识名称（用于输出）
 */
export function runTerrainSelfCheck(
  map: BattleTerrainMap,
  label: string = 'BattleTerrainMap',
): string {
  const stats = scanTerrainStats(map);
  const shapeCheck = checkLayerShapes(map);

  return formatSelfCheckReport({ label, stats, shapeCheck });
}

export { formatSelfCheckReport } from './terrain/formatTerrainSelfCheck';
