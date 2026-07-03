// ============================================================
// terrainSightDebug — 视线 / 射界地形调试输出
//
// 中文格式化，不侵入主流程。
// ============================================================

import type { SightSampleResult } from './terrainSightSample';

export function formatSightDebug(
  label: string,
  attackerId: string,
  targetId: string,
  sight: SightSampleResult,
  sightMod: number,
  hitMod: number,
): string {
  return [
    `[${label}]`,
    `观察者：${attackerId}`,
    `目标：${targetId}`,
    `采样格数：${sight.count}`,
    `经过森林：${sight.touchesForest ? '是' : '否'}`,
    `经过灌木：${sight.touchesBush ? '是' : '否'}`,
    `经过高地：${sight.touchesHigh ? '是' : '否'}`,
    `经过坡地：${sight.touchesSlope ? '是' : '否'}`,
    `地形遮挡：${sight.blockedByTerrain ? '是' : '否'}`,
    `视距系数：${sightMod.toFixed(2)}`,
    `命中系数：${hitMod.toFixed(2)}`,
    `结果：${sight.blockedByTerrain ? '山脊/高地遮挡' : hitMod < 1 ? '地形削弱' : '无影响'}`,
  ].join('\n');
}
