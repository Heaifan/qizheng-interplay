// ============================================================
// fireLogFormat — 开火日志文本格式化
//
// 从原 combat.ts 拆分，保持本文件 ≤100 行。
// 仅负责把命中上下文拼成中文日志基串，不改战斗公式。
// ============================================================

import type { RuntimeUnit } from '@/domain/types';
import type { DirectFireContext } from './directFireContext';
import { getSuppressionAccuracyMultiplier } from './suppression';

type Weapon = RuntimeUnit['combatProfile']['weapon'];

export interface FireLogResult {
  logBase: string;
  effectiveHitChance: number;
  burstDmgMult: number;
}

export function formatFireLogBase(
  ctx: DirectFireContext,
  attacker: RuntimeUnit,
  rounds: number,
  state: RuntimeUnit['weaponState'] | undefined,
  fireWeapon: Weapon,
): FireLogResult {
  const modParts: string[] = [];
  if (ctx.blocked) modParts.push('遮挡');
  if (ctx.throughBush) modParts.push('灌木');
  const modStr = modParts.length ? `｜${modParts.join('/')}` : '';

  const roundsStr = rounds > 1 ? `｜点射${rounds}发` : '';
  const ammoStr = state ? `｜弹仓 ${state.ammoInMagazine}/${fireWeapon.magazineSize ?? '?'}` : '';

  const burstDmgMult = rounds > 1 ? 1 + Math.min(rounds - 1, 6) * 0.10 : 1;
  const burstSupMult = rounds > 1 ? 1 + Math.min(rounds - 1, 8) * 0.25 : 1;
  const multStr = rounds > 1
    ? `｜伤×${burstDmgMult.toFixed(2)}｜压制×${burstSupMult.toFixed(2)}`
    : '';

  const suppressionAccMult = getSuppressionAccuracyMultiplier(attacker);
  const effectiveHitChance = ctx.hitChance * suppressionAccMult;
  const hitText = suppressionAccMult < 0.995
    ? `｜命中率 ${(ctx.hitChance * 100).toFixed(1)}%｜受压×${suppressionAccMult.toFixed(2)}｜实效 ${(effectiveHitChance * 100).toFixed(1)}%`
    : `｜命中率 ${(ctx.hitChance * 100).toFixed(1)}%`;

  const logBase =
    `${fireWeapon.name} 开火${roundsStr}${ammoStr}${multStr}` +
    `${hitText}` +
    `｜距 ${ctx.distance.toFixed(0)}m｜夹角 ${ctx.angleOffsetDeg.toFixed(0)}°` +
    `｜精度 ${ctx.weaponAccuracy.toFixed(3)}｜射程 ${ctx.effectiveRange.toFixed(0)}m` +
    `｜距离×${ctx.distanceModifier.toFixed(2)}` +
    `｜专注×${ctx.focusModifier.toFixed(2)}` +
    `｜打击×${ctx.strikeModifier.toFixed(2)}` +
    `${modStr}`;

  return { logBase, effectiveHitChance, burstDmgMult };
}
