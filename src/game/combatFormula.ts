import { clamp } from '@/domain/helpers';
import { segmentBlockedByAnyCover, segmentNearAnyBush } from '@/domain/geometry';
import { angleDiffRad, bearingBetween, radToDeg } from '@/domain/angles';
import { BUSHES, COVERS } from '@/domain/terrain';
import { deriveWeaponStats } from '@/domain/weapon';
import { calculateFireOutput } from '@/domain/fireOutput';
import type { RuntimeUnit } from '@/domain/types';

/** 直接火力上下文 — 单次射击的完整结算信息 */
export interface DirectFireContext {
  weaponName: string;
  distance: number;
  angleOffsetDeg: number;
  weaponAccuracy: number;
  effectiveRange: number;
  terminalEffect: number;
  distanceModifier: number;
  angleModifier: number;
  focusModifier: number;
  strikeModifier: number;
  sustainmentModifier: number;
  coverModifier: number;
  bushModifier: number;
  hitChance: number;
  averageDamage: number;
  fireCooldownMs: number;
  firePressure: number;
  blocked: boolean;
  throughBush: boolean;
  inRange: boolean;
  inFireArc: boolean;
}

const FIRE_ARC_HALF_DEG = 30;

/** 计算一次完整的直接火力上下文 */
export function calculateDirectFireContext(
  attacker: RuntimeUnit,
  target: RuntimeUnit,
): DirectFireContext {
  const weapon = attacker.combatProfile.weapon;
  const stats = deriveWeaponStats(weapon);
  const dx = target.x - attacker.x;
  const dy = target.y - attacker.y;
  const distance = Math.hypot(dx, dy);
  const targetBearing = bearingBetween(attacker.x, attacker.y, target.x, target.y);
  const angleOffsetDeg = radToDeg(angleDiffRad(targetBearing, attacker.angle));

  const inRange = distance <= stats.effectiveRange * 1.35;
  const inFireArc = angleOffsetDeg <= FIRE_ARC_HALF_DEG;

  const blocked = segmentBlockedByAnyCover(attacker.x, attacker.y, target.x, target.y, COVERS);
  const throughBush = segmentNearAnyBush(attacker.x, attacker.y, target.x, target.y, BUSHES);

  if (!inRange || !inFireArc) {
    return {
      weaponName: weapon.name,
      distance, angleOffsetDeg,
      weaponAccuracy: stats.weaponAccuracy,
      effectiveRange: stats.effectiveRange,
      terminalEffect: stats.terminalEffect,
      distanceModifier: 0, angleModifier: 0,
      focusModifier: 0, strikeModifier: 0, sustainmentModifier: 0,
      coverModifier: blocked ? 0.25 : 1,
      bushModifier: throughBush ? 0.6 : 1,
      hitChance: 0,
      averageDamage: 0,
      fireCooldownMs: 0,
      firePressure: 0,
      blocked, throughBush, inRange, inFireArc,
    };
  }

  const focus = attacker.combatProfile.states.focus;
  const strike = attacker.combatProfile.forces.strike;
  const sustain = attacker.combatProfile.forces.sustainment;

  const distanceModifier = clamp(1 - (distance / stats.effectiveRange) * 0.65, 0.25, 1);
  const angleModifier = clamp(1 - (angleOffsetDeg / FIRE_ARC_HALF_DEG) * 0.35, 0.65, 1);
  const focusModifier = 0.85 + (focus / 100) * 0.30;
  const strikeModifier = 0.85 + (strike / 100) * 0.30;
  const sustainmentModifier = 0.85 + (sustain / 100) * 0.30;
  const coverModifier = blocked ? 0.25 : 1;
  const bushModifier = throughBush ? 0.6 : 1;

  const hitChance = clamp(
    stats.weaponAccuracy * distanceModifier * angleModifier *
    focusModifier * strikeModifier * coverModifier * bushModifier,
    0.01, 0.95,
  );

  const fireForAve = calculateFireOutput(weapon, {
    rangeM: distance,
    targetType: 'personnel',
    protectionLevel: blocked ? 'medium_cover' : 'none',
  });
  const BASE_DAMAGE = 24;
  const averageDamage = BASE_DAMAGE * fireForAve.value * Math.sqrt(strikeModifier);
  const fireCooldownMs = 650 / stats.fireTempo / sustainmentModifier;
  const firePressure = hitChance * averageDamage * (1000 / fireCooldownMs);

  return {
    weaponName: weapon.name,
    distance, angleOffsetDeg,
    weaponAccuracy: stats.weaponAccuracy,
    effectiveRange: stats.effectiveRange,
    terminalEffect: stats.terminalEffect,
    distanceModifier, angleModifier,
    focusModifier, strikeModifier, sustainmentModifier,
    coverModifier, bushModifier,
    hitChance, averageDamage, fireCooldownMs, firePressure,
    blocked, throughBush, inRange, inFireArc,
  };
}
