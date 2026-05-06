import { PX_PER_METER } from '@/domain/constants';
import { segmentBlockedByAnyCover, segmentNearAnyBush } from '@/domain/geometry';
import { BUSHES, COVERS } from '@/domain/terrain';
import type { RuntimeUnit } from '@/domain/types';
import { BASE_HIT_CHANCE, MAX_RANGE } from './combat';

export const FIRE_SECTOR_RADIUS_M = 220;
export const FIRE_SECTOR_ANGLE_DEG = 75;
export const VISION_SECTOR_RADIUS_M = 360;
export const VISION_SECTOR_ANGLE_DEG = 120;
export const FIRE_SECTOR_RADIUS = FIRE_SECTOR_RADIUS_M * PX_PER_METER;
export const VISION_SECTOR_RADIUS = VISION_SECTOR_RADIUS_M * PX_PER_METER;
export const HALF_FIRE_SECTOR_RAD = (FIRE_SECTOR_ANGLE_DEG * Math.PI) / 360;
export const HALF_VISION_SECTOR_RAD = (VISION_SECTOR_ANGLE_DEG * Math.PI) / 360;

export function normalizeAngleRad(v: number): number {
  let a = v;
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export interface ReadabilityHint {
  attackerId: string;
  attackerX: number;
  attackerY: number;
  targetId: string;
  targetX: number;
  targetY: number;
  distance: number;
  blocked: boolean;
  throughBush: boolean;
  angleOffsetDeg: number;
  inFireSector: boolean;
  inVisionSector: boolean;
  hitChance: number;
  inRange: boolean;
  color: string;
}

export function computeReadabilityHints(units: readonly RuntimeUnit[]): ReadabilityHint[] {
  if (units.length < 2) return [];
  const [blue, red] = units;
  if (!blue || !red || blue.dead || red.dead) return [];

  const pair = [
    { attacker: blue, target: red },
    { attacker: red, target: blue },
  ];

  return pair.map(({ attacker, target }) => {
    const dx = target.x - attacker.x;
    const dy = target.y - attacker.y;
    const distance = Math.hypot(dx, dy);
    const blocked = segmentBlockedByAnyCover(attacker.x, attacker.y, target.x, target.y, COVERS);
    const throughBush = segmentNearAnyBush(attacker.x, attacker.y, target.x, target.y, BUSHES);
    const targetBearing = Math.atan2(dy, dx);
    const angleOffset = Math.abs(normalizeAngleRad(targetBearing - attacker.fireAngle));
    const inFireSector = distance <= FIRE_SECTOR_RADIUS && angleOffset <= HALF_FIRE_SECTOR_RAD;
    const inVisionSector = distance <= VISION_SECTOR_RADIUS && angleOffset <= HALF_VISION_SECTOR_RAD;
    const angleFactor = inFireSector
      ? 0.7 + Math.max(0, 1 - angleOffset / HALF_FIRE_SECTOR_RAD) * 0.3
      : inVisionSector
        ? 0.18
        : 0.08;
    let hitChance = BASE_HIT_CHANCE;
    hitChance *= angleFactor;
    if (blocked) hitChance *= 0.25;
    if (throughBush) hitChance *= 0.6;
    if (distance > MAX_RANGE) hitChance = 0;
    return {
      attackerId: attacker.id,
      attackerX: attacker.x,
      attackerY: attacker.y,
      targetId: target.id,
      targetX: target.x,
      targetY: target.y,
      distance,
      blocked,
      throughBush,
      angleOffsetDeg: (angleOffset * 180) / Math.PI,
      inFireSector,
      inVisionSector,
      hitChance,
      inRange: distance <= MAX_RANGE,
      color: attacker.stroke,
    };
  });
}
