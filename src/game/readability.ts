import { PX_PER_METER } from '@/domain/constants';
import { segmentBlockedByAnyCover, segmentNearAnyBush } from '@/domain/geometry';
import { BUSHES, COVERS } from '@/domain/terrain';
import type { RuntimeUnit } from '@/domain/types';
import { BASE_HIT_CHANCE, FIRE_ARC_HALF_RAD, MAX_RANGE } from './combat';

const VISION_ANGLE_DEG = 110;
const VISION_RANGE = 700;
const HALF_VISION_RAD = (VISION_ANGLE_DEG * Math.PI) / 360;

function normalizeAngle(v: number): number {
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
  inFireArc: boolean;
  inPerception: boolean;
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
    const angleOffset = Math.abs(normalizeAngle(targetBearing - attacker.angle));
    const inFireArc = angleOffset <= FIRE_ARC_HALF_RAD;
    const inPerception = angleOffset <= HALF_VISION_RAD && distance <= VISION_RANGE;
    const angleFactor = inFireArc
      ? 0.7 + Math.max(0, 1 - angleOffset / FIRE_ARC_HALF_RAD) * 0.3
      : inPerception
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
      inFireArc,
      inPerception,
      hitChance,
      inRange: distance <= MAX_RANGE,
      color: attacker.stroke,
    };
  });
}
