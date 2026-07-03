// ============================================================
// combatFormula — 直接火力战斗上下文计算
//
// 支持可选 BattleTerrainMap：森林/灌木削弱命中，高地/坡地阻挡。
// 无 map 时完全兼容旧行为。
// ============================================================

import { clamp } from '@/domain/helpers';
import { segmentBlockedByAnyCover, segmentNearAnyBush } from '@/domain/geometry';
import { angleDiffRad, bearingBetween, radToDeg } from '@/domain/angles';
import { BUSHES, COVERS } from '@/domain/terrain';
import type { BattleTerrainMap } from '@/domain/terrainMap';
import { deriveWeaponStats } from '@/domain/weapon';
import { calculateFireOutput } from '@/domain/fireOutput';
import { getWeaponById } from '@/domain/weaponCatalog';
import type { RuntimeUnit } from '@/domain/types';
import type { DirectFireContext } from './directFireContext';
import { sampleSightLine } from './terrainSightSample';
import { calcHitModifier } from './terrainSightFactor';

const FIRE_ARC_HALF_DEG = 30;

export function calculateDirectFireContext(
  attacker: RuntimeUnit,
  target: RuntimeUnit,
  map?: BattleTerrainMap,
): DirectFireContext {
  const weapon = getWeaponById(attacker.weaponId) ?? attacker.combatProfile.weapon;
  const stats = deriveWeaponStats(weapon);
  const dx = target.x - attacker.x;
  const dy = target.y - attacker.y;
  const distance = Math.hypot(dx, dy);
  const angleOffsetDeg = radToDeg(angleDiffRad(bearingBetween(attacker.x, attacker.y, target.x, target.y), attacker.angle));

  const inRange = distance <= stats.effectiveRange * 1.35;
  const inFireArc = angleOffsetDeg <= FIRE_ARC_HALF_DEG;
  const blocked = segmentBlockedByAnyCover(attacker.x, attacker.y, target.x, target.y, COVERS);
  const throughBush = segmentNearAnyBush(attacker.x, attacker.y, target.x, target.y, BUSHES);

  let terrainBlocked = false, terrainHitModifier = 1;
  if (map) {
    const sight = sampleSightLine(map, attacker.x, attacker.y, target.x, target.y);
    terrainBlocked = sight.blockedByTerrain;
    terrainHitModifier = calcHitModifier(sight);
  }

  const focus = attacker.combatProfile.states.focus;
  const strike = attacker.combatProfile.forces.strike;
  const sustain = attacker.combatProfile.forces.sustainment;
  const distanceModifier = inRange && inFireArc ? clamp(1 - (distance / stats.effectiveRange) * 0.65, 0.25, 1) : 0;
  const angleModifier = inRange && inFireArc ? clamp(1 - (angleOffsetDeg / FIRE_ARC_HALF_DEG) * 0.35, 0.65, 1) : 0;
  const focusModifier = inRange && inFireArc ? 0.85 + (focus / 100) * 0.30 : 0;
  const strikeModifier = inRange && inFireArc ? 0.85 + (strike / 100) * 0.30 : 0;
  const sustainmentModifier = inRange && inFireArc ? 0.85 + (sustain / 100) * 0.30 : 0;
  const coverModifier = blocked ? 0.25 : 1;
  const bushModifier = throughBush ? 0.6 : 1;

  const hitChance = inRange && inFireArc ? clamp(
    stats.weaponAccuracy * distanceModifier * angleModifier *
    focusModifier * strikeModifier * coverModifier * bushModifier * terrainHitModifier,
    0.01, 0.95,
  ) : 0;

  const fireForAve = calculateFireOutput(weapon, {
    rangeM: distance, targetType: 'personnel',
    protectionLevel: (blocked || terrainBlocked) ? 'medium_cover' : 'none',
  });
  const averageDamage = hitChance > 0 ? 24 * fireForAve.value * Math.sqrt(strikeModifier) : 0;
  const fireCooldownMs = hitChance > 0 ? 650 / stats.fireTempo / sustainmentModifier : 0;
  const firePressure = hitChance > 0 ? hitChance * averageDamage * (1000 / fireCooldownMs) : 0;

  return { weaponName: weapon.name, distance, angleOffsetDeg,
    weaponAccuracy: stats.weaponAccuracy, effectiveRange: stats.effectiveRange,
    terminalEffect: stats.terminalEffect,
    distanceModifier, angleModifier, focusModifier, strikeModifier, sustainmentModifier,
    coverModifier, bushModifier, terrainHitModifier,
    hitChance, averageDamage, fireCooldownMs, firePressure,
    blocked, throughBush, terrainBlocked, inRange, inFireArc };
}
