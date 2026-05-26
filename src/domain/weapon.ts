import type { WeaponProfile } from './types';
import { clamp } from './helpers';

const ACTION_TEMPO: Record<string, number> = {
  bolt: 0.85,
  semi: 1.05,
  auto: 1.25,
};

/** 武器推导结果 — weapon.ts 是唯一来源 */
export interface WeaponDerivedStats {
  weaponAccuracy: number;
  effectiveRange: number;
  terminalEffect: number;
  fireTempo: number;
  directFireContribution: number;
}

export function deriveWeaponStats(w: WeaponProfile): WeaponDerivedStats {
  const weaponAccuracy = clamp(
    0.60 + ((w.barrelLength - 500) / 500) * 0.10 + (w.sightMag - 1) * 0.03,
    0.45, 0.85,
  );
  const effectiveRange = clamp(
    550 + (w.barrelLength - 500) * 0.45 + (w.sightMag - 1) * 80,
    300, 1000,
  );
  const terminalEffect = Math.sqrt(w.caliber / 7.62);
  const fireTempo = ACTION_TEMPO[w.action] ?? 0.85;
  const directFireContribution = weaponAccuracy * terminalEffect * fireTempo * 100;
  return { weaponAccuracy, effectiveRange, terminalEffect, fireTempo, directFireContribution };
}
