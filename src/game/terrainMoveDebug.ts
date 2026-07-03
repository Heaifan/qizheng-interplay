// ============================================================
// terrainMoveDebug — 移动地形调试输出
//
// 格式化中文移动地形日志，不侵入 movement 主流程。
// 支持段采样结果（MoveSegmentResult）。
// ============================================================

import type { MoveSegmentResult } from './terrainMoveSample';

export interface MoveDebugInfo {
  unitId: string;
  nextX: number;
  nextY: number;
  seg: MoveSegmentResult;
  blocked: boolean;
}

export function formatMoveDebug(info: MoveDebugInfo): string {
  const { unitId, nextX, nextY, seg } = info;
  return [
    `[移动地形]`,
    `单位：${unitId}`,
    `移动段终点：${Math.round(nextX)},${Math.round(nextY)}`,
    `采样格数：${seg.count}`,
    `经过水体：${seg.touchesWater ? '是' : '否'}`,
    `经过森林：${seg.touchesForest ? '是' : '否'}`,
    `经过灌木：${seg.hasBush ? '是' : '否'}`,
    `经过坡地：${seg.hasSlope ? '是' : '否'}`,
    `经过高地：${seg.hasHigh ? '是' : '否'}`,
    `经过泥地：${seg.hasDirt ? '是' : '否'}`,
    `速度系数：${seg.factor.toFixed(2)}`,
    `结果：${seg.blocked ? '🚫 线段触水，停止移动' : seg.factor < 1 ? '减速移动' : '正常移动'}`,
  ].join('\n');
}
