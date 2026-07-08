// ============================================================
// tryFire — 直接火力结算主流程
//
// 从原 combat.ts 拆分，保持本文件 ≤100 行。
// 真实开火链路把 terrainMap 传入 calculateDirectFireContext，
// 使地形命中/遮挡修正真正生效（T5-R1-B P0-1）。
// ============================================================

import { bearingBetween } from '@/domain/angles';
import { calculateDirectFireContext } from './combatFormula';
import { getWeaponById } from '@/domain/weaponCatalog';
import { tryConsumeShot } from './weaponRuntime';
import { calculateSuppressionGain } from './suppression';
import type { RuntimeUnit } from '@/domain/types';
import type { CombatDeps } from './combatDeps';
import { formatFireLogBase } from './fireLogFormat';
import { applyFireResult } from './fireResolution';

export function runTryFire(
  d: CombatDeps,
  attacker: RuntimeUnit,
  target: RuntimeUnit,
  now: number,
): void {
  if (attacker.dead || target.dead) return;

  // Step 1: 射程 / 射界检查（消耗弹药前）
  const map = d.terrainMap.value ?? undefined;
  const ctx = calculateDirectFireContext(attacker, target, map);
  if (!ctx.inRange || !ctx.inFireArc) return;

  // Step 2: 弹药 / 装填 / 冷却检查
  const cycle = tryConsumeShot(attacker, now);
  if (!cycle.canFire) {
    if (cycle.reason === 'reloading') return;
    if (cycle.reason === 'cooldown') return;
    if (cycle.reason === 'reload_complete') {
      const weapon = getWeaponById(attacker.weaponId);
      d.addLog(attacker.id, `${weapon?.displayName ?? '武器'} 装填完成｜${weapon?.magazineSize ?? '?'}/${weapon?.magazineSize ?? '?'}`, 'log-system');
      return;
    }
    if (cycle.reason === 'start_reload') {
      const weapon = getWeaponById(attacker.weaponId);
      d.addLog(attacker.id, `${weapon?.displayName ?? '武器'} 开始装填（${((weapon?.reloadTimeMs ?? 3000) / 1000).toFixed(1)}s）`, 'log-system');
      return;
    }
    return;
  }

  // Step 3: 朝向与目标感知
  const targetBearing = bearingBetween(attacker.x, attacker.y, target.x, target.y);
  attacker.angle = targetBearing;
  attacker.aimAngle = targetBearing;
  attacker.fireAngle = targetBearing;
  const threatBearing = bearingBetween(target.x, target.y, attacker.x, attacker.y);
  target.angle = threatBearing;
  target.aimAngle = threatBearing;

  d.shots.value.push({
    x1: attacker.x, y1: attacker.y,
    x2: target.x, y2: target.y,
    color: attacker.stroke, alpha: 1, blocked: ctx.blocked,
  });

  const fireWeapon = getWeaponById(attacker.weaponId) ?? attacker.combatProfile.weapon;
  const state = attacker.weaponState;
  const rounds = cycle.rounds ?? 1;
  const { logBase, effectiveHitChance, burstDmgMult } = formatFireLogBase(ctx, attacker, rounds, state, fireWeapon);

  const hit = Math.random() < effectiveHitChance;
  const suppressionGain = calculateSuppressionGain({
    rounds,
    fireMode: fireWeapon.fireMode,
    hit,
    distanceFactor: ctx.distanceModifier,
    weaponSuppressionPower: fireWeapon.suppressionPower,
  });

  applyFireResult(d, ctx, attacker, target, fireWeapon, rounds, hit, suppressionGain, logBase, burstDmgMult, now);
}
