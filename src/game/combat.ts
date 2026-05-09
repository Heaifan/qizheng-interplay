import type { Ref } from 'vue';
import { BUSHES, COVERS } from '@/domain/terrain';
import { segmentBlockedByAnyCover, segmentNearAnyBush } from '@/domain/geometry';
import type { LogEntry, RuntimeUnit, ShotTrail } from '@/domain/types';

export const FIRE_COOLDOWN_MS = 550;
export const MAX_RANGE = 900;
export const BASE_HIT_CHANCE = 0.75;

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
    attacker.fireAngle = Math.atan2(dy, dx);
    const distance = Math.hypot(dx, dy);
    if (distance > MAX_RANGE) return;
    if (now - attacker.lastFireTime < FIRE_COOLDOWN_MS) return;

    attacker.lastFireTime = now;

    const blocked = segmentBlockedByAnyCover(
      attacker.x, attacker.y, target.x, target.y, COVERS,
    );
    const throughBush = segmentNearAnyBush(
      attacker.x, attacker.y, target.x, target.y, BUSHES,
    );

    let hitChance = BASE_HIT_CHANCE;
    if (blocked) hitChance *= 0.25;
    if (throughBush) hitChance *= 0.6;

    const hit = Math.random() < hitChance;
    d.shots.value.push({
      x1: attacker.x, y1: attacker.y,
      x2: target.x, y2: target.y,
      color: attacker.stroke, alpha: 1, blocked,
    });

    if (hit) {
      const damage = 16 + Math.floor(Math.random() * 15);
      target.hp = Math.max(0, target.hp - damage);
      if (target.hp === 0) {
        target.dead = true;
        d.addLog(attacker.id, `击毙 ${target.id}`, 'log-kill');
        d.mode.value = 'gameover';
        d.executionState.value = 'stopped';
      } else {
        d.addLog(attacker.id, `→ ${target.id}：造成 ${damage} 伤害`, 'log-hit');
      }
    } else {
      d.addLog(attacker.id, `→ ${target.id}：未命中`, 'log-miss');
    }
  }

  return { tryFire };
}
