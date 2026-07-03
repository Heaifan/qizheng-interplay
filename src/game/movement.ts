// ============================================================
// movement — 单位沿路径推进
//
// 支持可选 BattleTerrainMap 参数：
// 有地图 → 查询地形，调整速度，阻挡水体。
// 无地图 → 完全兼容旧行为。
// ============================================================

import { UNIT_MOVE_SPEED } from '@/domain/constants';
import type { BattleTerrainMap } from '@/domain/terrainMap';
import type { RuntimeUnit } from '@/domain/types';
import { getTerrainCell, isWaterAt } from '@/domain/terrainQuery';
import { calcMoveFactor } from './terrainMoveFactor';
import { isMoveBlockedByTerrain } from './terrainMoveBlock';
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

  // no map → old behavior
  if (!map) {
    moveTowards(unit, target, dx, dy, dist, speed);
    return;
  }

  // calculate next position
  const moveDist = Math.min(speed, dist);
  const stepX = dist > 0 ? (dx / dist) * moveDist : 0;
  const stepY = dist > 0 ? (dy / dist) * moveDist : 0;
  const nextX = unit.x + stepX;
  const nextY = unit.y + stepY;

  // check terrain at next position
  if (isWaterAt(map, nextX, nextY)) {
    unit.currentSpeedKmh = 0;
    const cell = getTerrainCell(map, nextX, nextY);
    const debug: MoveDebugInfo = { unitId: unit.id, nextX, nextY, cell, factor: 0, blocked: true };
    console.log(formatMoveDebug(debug));
    return;
  }

  const cell = getTerrainCell(map, nextX, nextY);
  const factor = cell ? calcMoveFactor(cell) : 1;
  const adjustedSpeed = speed * factor;

  if (dist < adjustedSpeed) {
    unit.x = target.x;
    unit.y = target.y;
    unit.currentPathIdx += 1;
    unit.currentSpeedKmh = unit.currentPathIdx < unit.path.length ? unit.maxSpeedKmh * factor : 0;
  } else {
    unit.x += (dx / dist) * adjustedSpeed;
    unit.y += (dy / dist) * adjustedSpeed;
    unit.currentSpeedKmh = unit.maxSpeedKmh * factor;
  }
}

function moveTowards(
  unit: RuntimeUnit,
  target: RuntimeUnit['path'][number],
  dx: number,
  dy: number,
  dist: number,
  speed: number,
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
