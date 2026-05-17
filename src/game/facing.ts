import { bearingBetween } from '@/domain/angles';
import type { RuntimeUnit } from '@/domain/types';

/** 每帧更新战术朝向：每个存活单位朝向最近的敌方单位 */
export function updateTacticalFacing(units: RuntimeUnit[]): void {
  for (const unit of units) {
    if (unit.dead) continue;
    const enemy = findNearestEnemy(unit, units);
    if (!enemy) continue;
    unit.angle = bearingBetween(unit.x, unit.y, enemy.x, enemy.y);
  }
}

function findNearestEnemy(unit: RuntimeUnit, units: RuntimeUnit[]): RuntimeUnit | null {
  let nearest: RuntimeUnit | null = null;
  let nearestDistSq = Infinity;

  for (const other of units) {
    if (other.id === unit.id || other.dead) continue;
    const dx = other.x - unit.x;
    const dy = other.y - unit.y;
    const distSq = dx * dx + dy * dy;
    if (distSq < nearestDistSq) {
      nearest = other;
      nearestDistSq = distSq;
    }
  }

  return nearest;
}
