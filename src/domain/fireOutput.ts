import type { EffectClass, WeaponProfile } from './types';
import {
  EFFECT_CLASS_BASE,
  PROTECTION_FACTORS,
  getRangeFactorsByOutputMode,
  type ProtectionLevel,
  type RangeBandId,
} from './fireOutputTables';

export type { ProtectionLevel, RangeBandId };

export type TargetType =
  | 'personnel'
  | 'light_vehicle'
  | 'armor'
  | 'structure'
  | 'obstacle';

export interface TargetEffectVector {
  personnel: number;
  lightVehicle: number;
  armor: number;
  structure: number;
  obstacle: number;
}

export interface FireOutputContext {
  rangeM: number;
  targetType: TargetType;
  protectionLevel: ProtectionLevel;
  deliveryModeFactor?: number;
}

export interface FireOutputResult {
  value: number;
  targetBase: number;
  rangeFactor: number;
  protectionFactor: number;
  deliveryModeFactor: number;
  effectClass: EffectClass;
  rangeBand: RangeBandId;
  protectionLevel: ProtectionLevel;
  explanation: string[];
}

function getRangeFactor(rangeM: number, outputMode: string): { id: RangeBandId; factor: number } {
  const factors = getRangeFactorsByOutputMode(outputMode);
  const band = factors.find((b) => rangeM >= b.min && rangeM < b.max);
  return {
    id: band?.id ?? 'extreme',
    factor: band?.factor ?? 0.55,
  };
}

function getTargetBase(effectClass: EffectClass, targetType: TargetType): number {
  const vector = EFFECT_CLASS_BASE[effectClass];
  switch (targetType) {
    case 'personnel': return vector.personnel;
    case 'light_vehicle': return vector.lightVehicle;
    case 'armor': return vector.armor;
    case 'structure': return vector.structure;
    case 'obstacle': return vector.obstacle;
  }
}

export function calculateFireOutput(
  weapon: WeaponProfile,
  context: FireOutputContext,
): FireOutputResult {
  const effectClass = weapon.effectClass;
  const { id: rangeBand, factor: rangeFactor } = getRangeFactor(context.rangeM, weapon.outputMode);
  const targetBase = getTargetBase(effectClass, context.targetType);
  const protectionFactor = PROTECTION_FACTORS[context.protectionLevel];
  const deliveryModeFactor = context.deliveryModeFactor ?? 1.0;

  const value = targetBase * rangeFactor * protectionFactor * deliveryModeFactor;

  return {
    value,
    targetBase,
    rangeFactor,
    protectionFactor,
    deliveryModeFactor,
    effectClass,
    rangeBand,
    protectionLevel: context.protectionLevel,
    explanation: [
      `效果等级 ${effectClass} 对 ${context.targetType} 基准 ${targetBase.toFixed(2)}`,
      `距离段 ${rangeBand} 修正 ×${rangeFactor.toFixed(2)}`,
      `防护 ${context.protectionLevel} 修正 ×${protectionFactor.toFixed(2)}`,
      `投送方式修正 ×${deliveryModeFactor.toFixed(2)}`,
      `火力输出 ${value.toFixed(2)}`,
    ],
  };
}
