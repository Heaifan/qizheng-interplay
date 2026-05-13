import type { Ref } from 'vue';
import { BUSHES, COVERS } from '@/domain/terrain';
import { segmentBlockedByAnyCover, segmentNearAnyBush } from '@/domain/geometry';
import { angleDiffRad, bearingBetween, radToDeg } from '@/domain/angles';
import type { LogEntry, RuntimeUnit, ShotTrail } from '@/domain/types';

export const FIRE_COOLDOWN_MS = 550;
export const MAX_RANGE = 900;
export const BASE_HIT_CHANCE = 0.75;

const FIRE_ARC_DEG = 60;
export const FIRE_ARC_HALF_RAD = (FIRE_ARC_DEG * Math.PI) / 360;

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
    const dx = target.x - attacker.x;
    const dy = target.y - attacker.y;
    const distance = Math.hypot(dx, dy);
    if (distance > MAX_RANGE) return;

    const targetBearing = bearingBetween(attacker.x, attacker.y, target.x, target.y);
    const angleOffRad = angleDiffRad(targetBearing, attacker.angle);
    if (angleOffRad > FIRE_ARC_HALF_RAD) return;
    if (now - attacker.lastFireTime < FIRE_COOLDOWN_MS) return;

    // sync tactical facing to actual shot direction
    attacker.angle = targetBearing;
    attacker.fireAngle = targetBearing;
    const threatBearing = bearingBetween(target.x, target.y, attacker.x, attacker.y);
    target.angle = threatBearing;
    attacker.lastFireTime = now;

    const blocked = segmentBlockedByAnyCover(
      attacker.x, attacker.y, target.x, target.y, COVERS,
    );
    const throughBush = segmentNearAnyBush(
      attacker.x, attacker.y, target.x, target.y, BUSHES,
    );

    let hitChance = BASE_HIT_CHANCE;
    const mods: string[] = [];
    if (blocked) { hitChance *= 0.25; mods.push('遮挡'); }
    if (throughBush) { hitChance *= 0.6; mods.push('灌木'); }

    const hit = Math.random() < hitChance;
    d.shots.value.push({
      x1: attacker.x, y1: attacker.y,
      x2: target.x, y2: target.y,
      color: attacker.stroke, alpha: 1, blocked,
    });

    const logBase = `开火｜距 ${distance.toFixed(0)}m｜夹角 ${radToDeg(angleOffRad).toFixed(0)}°｜命中率 ${(hitChance * 100).toFixed(0)}%${mods.length ? `｜${mods.join('/')}` : ''}`;

    if (hit) {
      const damage = 16 + Math.floor(Math.random() * 15);
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
