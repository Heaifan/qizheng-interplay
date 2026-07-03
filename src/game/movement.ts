// ============================================================
// movement — 单位沿路径推进
//
// 支持可选 BattleTerrainMap 参数：
// 有地图 → 线段采样判断水体阻挡 + 地形综合减速。
// 无地图 → 完全兼容旧行为。
// ============================================================

import { UNIT_MOVE_SPEED } from '@/domain/constants';
import type { BattleTerrainMap } from '@/domain/terrainMap';
import type { RuntimeUnit } from '@/domain/types';
import { sampleMoveSegment } from './terrainMoveSample';
import { formatMoveDebug, type MoveDebugInfo } from './terrainMoveDebug';

export function advanceUnitAlongPath(
  unit: RuntimeUnit,
  speed: number = UNIT_MOVE_SPEED,
  map?: BattleTerrainMap,
): void {
  if (unit.dead || unit.currentPathIdx >= unit.path.length) {
    unit.currentSpeedKmh = 0;
    return;
  }

  const target = unit.path[unit.currentPathIdx]!;
  const dx = target.x - unit.x;
  const dy = target.y - unit.y;
  const dist = Math.hypot(dx, dy);

  if (!map) {
    moveLegacy(unit, target, dx, dy, dist, speed);
    return;
  }

  const moveDist = Math.min(speed, dist);
  const stepX = dist > 0 ? (dx / dist) * moveDist : 0;
  const stepY = dist > 0 ? (dy / dist) * moveDist : 0;
  const nextX = unit.x + stepX;
  const nextY = unit.y + stepY;

  // segment sample: detect water crossing + terrain mix
  const seg = sampleMoveSegment(map, unit.x, unit.y, nextX, nextY);

  if (seg.blocked) {
    unit.currentSpeedKmh = 0;
    const debug: MoveDebugInfo = { unitId: unit.id, nextX, nextY, seg, blocked: true };
    console.log(formatMoveDebug(debug));
    return;
  }

  const adjustedSpeed = speed * seg.factor;

  if (dist < adjustedSpeed) {
    unit.x = target.x;
    unit.y = target.y;
    unit.currentPathIdx += 1;
    unit.currentSpeedKmh = unit.currentPathIdx < unit.path.length ? unit.maxSpeedKmh * seg.factor : 0;
  } else {
    unit.x += (dx / dist) * adjustedSpeed;
    unit.y += (dy / dist) * adjustedSpeed;
    unit.currentSpeedKmh = unit.maxSpeedKmh * seg.factor;
  }
}

function moveLegacy(
  unit: RuntimeUnit,
  target: RuntimeUnit['path'][number],
  dx: number, dy: number,
  dist: number, speed: number,
): void {
  if (dist < speed) {
    unit.x = target.x;
    unit.y = target.y;
    unit.currentPathIdx += 1;
    unit.currentSpeedKmh = unit.currentPathIdx < unit.path.length ? unit.maxSpeedKmh : 0;
  } else {
    unit.x += (dx / dist) * speed;
    unit.y += (dy / dist) * speed;
    unit.currentSpeedKmh = unit.maxSpeedKmh;
  }
}
