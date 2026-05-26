import type { WeaponProfile } from './types';
import {
  PROTECTION_FACTORS,
  type ProtectionLevel,
  type RangeBandId,
} from './fireOutputTables';
import {
  resolveWeaponOutputProfile,
  getRangeFactor,
  type WeaponOutputProfile,
} from './weaponOutputProfiles';

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
  effectClass: string;
  rangeBand: RangeBandId;
  protectionLevel: ProtectionLevel;
  outputProfileId: string;
  outputProfileLabel: string;
  outputProfileDescription: string;
  explanation: string[];
}

function getTargetBase(profile: WeaponOutputProfile, targetType: TargetType): number {
  const v = profile.targetBase;
  switch (targetType) {
    case 'personnel': return v.personnel;
    case 'light_vehicle': return v.lightVehicle;
    case 'armor': return v.armor;
    case 'structure': return v.structure;
    case 'obstacle': return v.obstacle;
  }
}

export function calculateFireOutput(
  weapon: WeaponProfile,
  context: FireOutputContext,
): FireOutputResult {
  const profile = resolveWeaponOutputProfile(weapon);
  const { id: rangeBand, factor: rangeFactor } = getRangeFactor(context.rangeM, profile.rangeModelId);
  const targetBase = getTargetBase(profile, context.targetType);
  const protectionFactor = PROTECTION_FACTORS[context.protectionLevel];
  const deliveryModeFactor = context.deliveryModeFactor ?? 1.0;
  const value = targetBase * rangeFactor * protectionFactor * deliveryModeFactor;

  return {
    value,
    targetBase,
    rangeFactor,
    protectionFactor,
    deliveryModeFactor,
    effectClass: weapon.effectClass,
    rangeBand,
    protectionLevel: context.protectionLevel,
    outputProfileId: profile.id,
    outputProfileLabel: profile.label,
    outputProfileDescription: profile.description,
    explanation: [
      `输出档案 ${profile.label} 对 ${context.targetType} 基准 ${targetBase.toFixed(2)}`,
      `距离段 ${rangeBand} 修正 ×${rangeFactor.toFixed(2)}`,
      `防护 ${context.protectionLevel} 修正 ×${protectionFactor.toFixed(2)}`,
      `投送方式修正 ×${deliveryModeFactor.toFixed(2)}`,
      `火力输出 ${value.toFixed(2)}`,
    ],
  };
}
