// ============================================================
// combat — 战斗动作装配
//
// 仅负责把依赖装配成 createCombatActions，真实开火逻辑见 tryFire.ts。
// 从原 145 行拆分，本文件保持 ≤100 行。
// ============================================================

import type { RuntimeUnit } from '@/domain/types';
import type { CombatDeps } from './combatDeps';
import { runTryFire } from './tryFire';

export { missionTimeLabel, FIRE_ARC_HALF_RAD } from './combatDeps';
export type { CombatDeps } from './combatDeps';

export function createCombatActions(d: CombatDeps) {
  function tryFire(attacker: RuntimeUnit, target: RuntimeUnit, now: number): void {
    runTryFire(d, attacker, target, now);
  }
  return { tryFire };
}
