import type { Ref } from 'vue';
import { bearingBetween } from '@/domain/angles';
import { calculateDirectFireContext } from './combatFormula';
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

    const ctx = calculateDirectFireContext(attacker, target);
    if (!ctx.inRange || !ctx.inFireArc) return;
    if (now - attacker.lastFireTime < ctx.fireCooldownMs) return;

    const targetBearing = bearingBetween(attacker.x, attacker.y, target.x, target.y);
    attacker.angle = targetBearing;
    attacker.fireAngle = targetBearing;
    const threatBearing = bearingBetween(target.x, target.y, attacker.x, attacker.y);
    target.angle = threatBearing;
    attacker.lastFireTime = now;

    d.shots.value.push({
      x1: attacker.x, y1: attacker.y,
      x2: target.x, y2: target.y,
      color: attacker.stroke, alpha: 1, blocked: ctx.blocked,
    });

    const modParts: string[] = [];
    if (ctx.blocked) modParts.push('遮挡');
    if (ctx.throughBush) modParts.push('灌木');
    const modStr = modParts.length ? `｜${modParts.join('/')}` : '';

    const logBase =
      `${ctx.weaponName} 开火` +
      `｜距 ${ctx.distance.toFixed(0)}m｜夹角 ${ctx.angleOffsetDeg.toFixed(0)}°` +
      `｜精度 ${ctx.weaponAccuracy.toFixed(3)}｜射程 ${ctx.effectiveRange.toFixed(0)}m` +
      `｜距离×${ctx.distanceModifier.toFixed(2)}` +
      `｜专注×${ctx.focusModifier.toFixed(2)}` +
      `｜打击×${ctx.strikeModifier.toFixed(2)}` +
      `${modStr}` +
      `｜命中率 ${(ctx.hitChance * 100).toFixed(1)}%` +
      `｜火力压力 ${ctx.firePressure.toFixed(2)}`;

    const hit = Math.random() < ctx.hitChance;
    if (hit) {
      const damage = Math.round(ctx.averageDamage * (0.75 + Math.random() * 0.5));
      target.hp = Math.max(0, target.hp - damage);
      if (target.hp === 0) {
        target.dead = true;
        d.addLog(attacker.id, `击毙 ${target.id}`, 'log-kill');
        d.mode.value = 'gameover';
        d.executionState.value = 'stopped';
      } else {
        d.addLog(attacker.id, `→ ${target.id}：${logBase}｜命中，造成 ${damage} 伤害`, 'log-hit');
      }
    } else {
      d.addLog(attacker.id, `→ ${target.id}：${logBase}｜未命中`, 'log-miss');
    }
  }

  return { tryFire };
}
