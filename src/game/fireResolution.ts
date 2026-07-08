// ============================================================
// fireResolution — 开火结算与日志落地
//
// 从 tryFire.ts 拆分，保持本文件 ≤100 行。
// 在命中判定后结算伤害/压制并写入日志与 store。
// ============================================================

import { calculateFireOutput } from '@/domain/fireOutput';
import { formatFireOutputTag } from '@/domain/fireOutputFormat';
import { applySuppression } from './suppression';
import type { RuntimeUnit } from '@/domain/types';
import type { DirectFireContext } from './directFireContext';
import type { CombatDeps } from './combatDeps';

type Weapon = RuntimeUnit['combatProfile']['weapon'];

export function applyFireResult(
  d: CombatDeps,
  ctx: DirectFireContext,
  attacker: RuntimeUnit,
  target: RuntimeUnit,
  fireWeapon: Weapon,
  rounds: number,
  hit: boolean,
  suppressionGain: number,
  logBase: string,
  burstDmgMult: number,
  now: number,
): void {
  applySuppression(target, suppressionGain, now);
  attacker.suppressionDealt += suppressionGain;
  target.suppressionReceived += suppressionGain;
  target.suppressionEventCount++;

  const fireOutput = calculateFireOutput(fireWeapon, {
    rangeM: ctx.distance,
    targetType: 'personnel',
    protectionLevel: ctx.blocked ? 'medium_cover' : 'none',
  });
  const foTag = formatFireOutputTag(fireOutput.value, fireOutput.outputProfileLabel, fireOutput.rangeBand, fireOutput.protectionLevel);
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
