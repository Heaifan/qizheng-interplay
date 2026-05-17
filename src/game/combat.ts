import type { Ref } from 'vue';
import { bearingBetween } from '@/domain/angles';
import { calculateDirectFireContext } from './combatFormula';
import { calculateFireOutput } from '@/domain/fireOutput';
import { formatFireOutputTag } from '@/domain/fireOutputFormat';
import { getWeaponById } from '@/domain/weaponCatalog';
import { tryConsumeShot } from './weaponRuntime';
import { calculateSuppressionGain, applySuppression, getSuppressionAccuracyMultiplier } from './suppression';
import type { LogEntry, RuntimeUnit, ShotTrail } from '@/domain/types';

export const FIRE_ARC_HALF_RAD = (60 * Math.PI) / 360;

export function missionTimeLabel(elapsedMs: number): string {
  const sec = Math.max(0, Math.floor(elapsedMs / 1000));
  return `T+${sec}s`;
}

export interface CombatDeps {
  units: Ref<RuntimeUnit[]>;
  shots: Ref<ShotTrail[]>;
  logs: Ref<LogEntry[]>;
  mode: Ref<string>;
  executionState: Ref<string>;
  simElapsedMs: Ref<number>;
  addLog: (unitId: string, text: string, tone: LogEntry['tone']) => void;
}

export function createCombatActions(d: CombatDeps) {
  function tryFire(attacker: RuntimeUnit, target: RuntimeUnit, now: number): void {
    if (attacker.dead || target.dead) return;

    // Step 1: Check range & fire arc before consuming ammo
    const ctx = calculateDirectFireContext(attacker, target);
    if (!ctx.inRange || !ctx.inFireArc) return;

    // Step 2: Ammo/reload/cooldown check (uses sim time, not wall clock)
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

    const modParts: string[] = [];
    if (ctx.blocked) modParts.push('遮挡');
    if (ctx.throughBush) modParts.push('灌木');
    const modStr = modParts.length ? `｜${modParts.join('/')}` : '';

    const rounds = cycle.rounds ?? 1;
    const roundsStr = rounds > 1 ? `｜点射${rounds}发` : '';
    const ammoStr = state ? `｜弹仓 ${state.ammoInMagazine}/${fireWeapon.magazineSize ?? '?'}` : '';

    const burstDmgMult = rounds > 1 ? 1 + Math.min(rounds - 1, 6) * 0.10 : 1;
    const burstSupMult = rounds > 1 ? 1 + Math.min(rounds - 1, 8) * 0.25 : 1;
    const multStr = rounds > 1
      ? `｜伤×${burstDmgMult.toFixed(2)}｜压制×${burstSupMult.toFixed(2)}`
      : '';

    const logBase =
      `${fireWeapon.name} 开火${roundsStr}${ammoStr}${multStr}` +
      `｜距 ${ctx.distance.toFixed(0)}m｜夹角 ${ctx.angleOffsetDeg.toFixed(0)}°` +
      `｜精度 ${ctx.weaponAccuracy.toFixed(3)}｜射程 ${ctx.effectiveRange.toFixed(0)}m` +
      `｜距离×${ctx.distanceModifier.toFixed(2)}` +
      `｜专注×${ctx.focusModifier.toFixed(2)}` +
      `｜打击×${ctx.strikeModifier.toFixed(2)}` +
      `${modStr}` +
      `｜命中率 ${(ctx.hitChance * 100).toFixed(1)}%` +
      `｜火力压力 ${ctx.firePressure.toFixed(2)}`;

    const fireOutput = calculateFireOutput(fireWeapon, {
      rangeM: ctx.distance,
      targetType: 'personnel',
      protectionLevel: ctx.blocked ? 'medium_cover' : 'none',
    });

    const foTag = formatFireOutputTag(fireOutput.value, fireOutput.outputProfileLabel, fireOutput.rangeBand, fireOutput.protectionLevel);

    const suppressionAccMult = getSuppressionAccuracyMultiplier(attacker);
    const effectiveHitChance = ctx.hitChance * suppressionAccMult;

    const hit = Math.random() < effectiveHitChance;

    const suppressionGain = calculateSuppressionGain({
      firePressure: ctx.firePressure,
      rounds,
      fireMode: fireWeapon.fireMode,
      hit,
      distanceFactor: ctx.distanceModifier,
      weaponSuppressionPower: fireWeapon.suppressionPower,
    });

    applySuppression(target, suppressionGain, now);
    attacker.suppressionDealt += suppressionGain;
    target.suppressionReceived += suppressionGain;
    target.suppressionHitCount++;
    const supLog = `｜压制+${suppressionGain.toFixed(2)}｜${target.id}压制${target.suppression.toFixed(2)}`;

    if (hit) {
      const baseDamage = 24;
      const randomSwing = 0.85 + Math.random() * 0.3;
      const damage = Math.max(1, Math.round(baseDamage * fireOutput.value * randomSwing * burstDmgMult));
      target.hp = Math.max(0, target.hp - damage);
      if (target.hp === 0) {
        target.dead = true;
        d.addLog(attacker.id, `→ ${target.id}：${logBase}｜${foTag}｜命中，造成 ${damage} 伤害，击毙${supLog}`, 'log-kill');
        d.mode.value = 'gameover';
        d.executionState.value = 'stopped';
      } else {
        d.addLog(attacker.id, `→ ${target.id}：${logBase}｜${foTag}｜命中，造成 ${damage} 伤害${supLog}`, 'log-hit');
      }
    } else {
      d.addLog(attacker.id, `→ ${target.id}：${logBase}｜未命中${supLog}`, 'log-miss');
    }
  }

  return { tryFire };
}
