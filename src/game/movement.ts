import { UNIT_MOVE_SPEED } from '@/domain/constants';
import type { RuntimeUnit } from '@/domain/types';

/** 沿路径推进单位位置 — 单一职责：移动 */

export function advanceUnitAlongPath(unit: RuntimeUnit, speed: number = UNIT_MOVE_SPEED): void {
  if (unit.dead || unit.currentPathIdx >= unit.path.length) {
    unit.currentSpeedKmh = 0;
    return;
  }
  const target = unit.path[unit.currentPathIdx]!;
  const dx = target.x - unit.x;
  const dy = target.y - unit.y;
  const dist = Math.hypot(dx, dy);

  if (dist < speed) {
    unit.x = target.x;
    unit.y = target.y;
    unit.currentPathIdx += 1;
    // Still moving if next waypoint exists
    unit.currentSpeedKmh = unit.currentPathIdx < unit.path.length ? unit.maxSpeedKmh : 0;
  } else {
    unit.x += (dx / dist) * speed;
    unit.y += (dy / dist) * speed;
    unit.currentSpeedKmh = unit.maxSpeedKmh;
  }
}
