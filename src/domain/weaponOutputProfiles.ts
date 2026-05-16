import type { WeaponProfile } from './types';
import { EFFECT_CLASS_BASE } from './fireOutputTables';
import { getRangeFactorsByOutputMode } from './fireOutputTables';
import type { TargetType, TargetEffectVector } from './fireOutput';
import type { RangeBandId } from './fireOutputTables';

/** 距离模型：一组距离段 */
export interface RangeModelEntry {
  id: RangeBandId;
  min: number;
  max: number;
  factor: number;
}

/** 武器输出档案 */
export interface WeaponOutputProfile {
  id: string;
  label: string;
  targetBase: TargetEffectVector;
  rangeModelId: string;
  description: string;
}

// ---- 距离模型表 ----
export const RANGE_MODELS: Record<string, readonly RangeModelEntry[]> = {
  rifle_kinetic: [
    { id: 'point_blank', min: 0, max: 50, factor: 1.0 },
    { id: 'short', min: 50, max: 150, factor: 0.95 },
    { id: 'medium', min: 150, max: 300, factor: 0.9 },
    { id: 'long', min: 300, max: 500, factor: 0.75 },
    { id: 'extreme', min: 500, max: Infinity, factor: 0.55 },
  ],
} as const;

// ---- 输出档案表 ----
export const OUTPUT_PROFILES: Record<string, WeaponOutputProfile> = {
  full_power_rifle_direct: {
    id: 'full_power_rifle_direct',
    label: '全威力步枪弹直射',
    targetBase: { personnel: 1.0, lightVehicle: 0.2, armor: 0.01, structure: 0.04, obstacle: 0.03 },
    rangeModelId: 'rifle_kinetic',
    description: '以全威力步枪弹命中无防护人员作为 1.00 基准；对轻车辆有有限破坏；对装甲、工事、障碍效果很弱。',
  },
};

/** 取距离修正 */
export function getRangeFactor(
  rangeM: number,
  rangeModelId: string,
): { id: RangeBandId; factor: number } {
  const entries = RANGE_MODELS[rangeModelId];
  if (entries) {
    const band = entries.find((b) => rangeM >= b.min && rangeM < b.max);
    if (band) return { id: band.id, factor: band.factor };
  }
  return { id: 'extreme' as RangeBandId, factor: 0.55 };
}

/** Fallback：根据旧 effectClass + outputMode 取目标基础值 */
function fallbackTargetBase(effectClass: string, targetType: TargetType): number {
  const vector = EFFECT_CLASS_BASE[effectClass as keyof typeof EFFECT_CLASS_BASE];
  if (!vector) return 0.5;
  switch (targetType) {
    case 'personnel': return vector.personnel;
    case 'light_vehicle': return vector.lightVehicle;
    case 'armor': return vector.armor;
    case 'structure': return vector.structure;
    case 'obstacle': return vector.obstacle;
  }
}

/** 解析武器输出档案：优先 outputProfileId，fallback 到旧 effectClass/outputMode */
export function resolveWeaponOutputProfile(weapon: WeaponProfile): WeaponOutputProfile {
  // 优先使用 outputProfileId
  if (weapon.outputProfileId) {
    const profile = OUTPUT_PROFILES[weapon.outputProfileId];
    if (profile) return profile;
  }

  // Fallback 1：从旧字段动态构造档案
  const ecLabel = weapon.effectClass || 'full_power_rifle';
  const omLabel = weapon.outputMode || 'kinetic_single';
  return {
    id: `fallback_${ecLabel}_${omLabel}`,
    label: `${ecLabel}/${omLabel}`,
    targetBase: {
      personnel: fallbackTargetBase(ecLabel, 'personnel'),
      lightVehicle: fallbackTargetBase(ecLabel, 'light_vehicle'),
      armor: fallbackTargetBase(ecLabel, 'armor'),
      structure: fallbackTargetBase(ecLabel, 'structure'),
      obstacle: fallbackTargetBase(ecLabel, 'obstacle'),
    },
    rangeModelId: omLabel === 'kinetic_single' || omLabel === 'kinetic_burst' || omLabel === 'kinetic_auto' || omLabel === 'kinetic_penetrator'
      ? 'rifle_kinetic'
      : 'rifle_kinetic',
    description: `来自旧字段 ${ecLabel}/${omLabel} 的兼容输出档案`,
  };
}
