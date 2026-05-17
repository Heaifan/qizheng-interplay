import type { RuntimeUnit } from '@/domain/types';

/** 计算一次射击造成的压制增量 */
export function calculateSuppressionGain(input: {
  firePressure: number;
  rounds: number;
  fireMode: string | undefined;
  hit: boolean;
  distanceFactor: number;
  weaponSuppressionPower?: number;
}): number {
  const roundsFactor =
    input.fireMode === 'auto' || input.fireMode === 'burst'
      ? 1 + Math.min(Math.max(input.rounds - 1, 0), 8) * 0.25
      : 1;

  const hitFactor = input.hit ? 1.25 : 0.70;
  const base = input.weaponSuppressionPower ?? 0.04;

  return base * roundsFactor * hitFactor * input.distanceFactor;
}

/** 应用压制到目标 */
export function applySuppression(
  target: RuntimeUnit,
  gain: number,
  nowMs: number,
): void {
  target.suppression = Math.min(1, (target.suppression ?? 0) + gain);
  if (target.suppression > (target.peakSuppression ?? 0)) {
    target.peakSuppression = target.suppression;
  }
  target.lastSuppressedAtMs = nowMs;
}

/** 每 tick 衰减压制 */
export function decaySuppression(unit: RuntimeUnit, deltaMs: number): void {
  const decayPerSecond = 0.08;
  const decay = decayPerSecond * (deltaMs / 1000);
  unit.suppression = Math.max(0, (unit.suppression ?? 0) - decay);
}

/** 压制对命中率的影响倍率 */
export function getSuppressionAccuracyMultiplier(unit: RuntimeUnit): number {
  const s = unit.suppression ?? 0;
  return Math.max(0.55, 1 - s * 0.45);
}

/** 压制对开火间隔的影响倍率 */
export function getSuppressionFireIntervalMultiplier(unit: RuntimeUnit): number {
  const s = unit.suppression ?? 0;
  return 1 + s * 0.60;
}

/** 压制状态文本标签 */
export function getSuppressionLabel(s: number): string {
  if (s >= 0.75) return '强压制';
  if (s >= 0.45) return '中度压制';
  if (s >= 0.20) return '轻度压制';
  return '无压制';
}
