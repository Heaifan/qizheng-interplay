import { angleDiffRad, bearingBetween, radToDeg } from '@/domain/angles';
import type { RuntimeUnit } from '@/domain/types';
import { FIRE_ARC_HALF_RAD } from './combat';
import { calculateDirectFireContext } from './combatFormula';

const VISION_ANGLE_DEG = 110;
const VISION_RANGE = 700;
const HALF_VISION_RAD = (VISION_ANGLE_DEG * Math.PI) / 360;

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
  targetBearing: number;
  attackerFacing: number;
  fireArcHalfDeg: number;
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
    const ctx = calculateDirectFireContext(attacker, target);
    const targetBearing = bearingBetween(attacker.x, attacker.y, target.x, target.y);
    const angleOffset = angleDiffRad(targetBearing, attacker.angle);
    const inPerception = angleOffset <= HALF_VISION_RAD && ctx.distance <= VISION_RANGE;

    return {
      attackerId: attacker.id,
      attackerX: attacker.x, attackerY: attacker.y,
      targetId: target.id,
      targetX: target.x, targetY: target.y,
      distance: ctx.distance,
      blocked: ctx.blocked,
      throughBush: ctx.throughBush,
      angleOffsetDeg: ctx.angleOffsetDeg,
      targetBearing,
      attackerFacing: attacker.angle,
      fireArcHalfDeg: radToDeg(FIRE_ARC_HALF_RAD),
      inFireArc: ctx.inFireArc,
      inPerception,
      hitChance: ctx.hitChance,
      inRange: ctx.inRange,
      color: attacker.stroke,
    };
  });
}
