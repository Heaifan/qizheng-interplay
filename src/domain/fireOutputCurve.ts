import type { WeaponProfile } from './types';
import {
  calculateFireOutput,
  type ProtectionLevel,
  type TargetType,
} from './fireOutput';

export interface FireOutputCurvePoint {
  rangeM: number;
  value: number;
  rangeBand: string;
}

export function generateFireOutputCurve(
  weapon: WeaponProfile,
  targetType: TargetType = 'personnel',
  protectionLevel: ProtectionLevel = 'none',
): FireOutputCurvePoint[] {
  const ranges = [0, 25, 50, 100, 150, 200, 300, 400, 500, 700, 1000];

  return ranges.map((rangeM) => {
    const result = calculateFireOutput(weapon, { rangeM, targetType, protectionLevel });
    return { rangeM, value: result.value, rangeBand: result.rangeBand };
  });
}

export interface FireOutputTargetRow {
  targetType: TargetType;
  value: number;
}

export function generateFireOutputTargetTable(
  weapon: WeaponProfile,
  rangeM = 100,
  protectionLevel: ProtectionLevel = 'none',
): FireOutputTargetRow[] {
  const targetTypes: TargetType[] = [
    'personnel', 'light_vehicle', 'armor', 'structure', 'obstacle',
  ];
  return targetTypes.map((targetType) => ({
    targetType,
    value: calculateFireOutput(weapon, { rangeM, targetType, protectionLevel }).value,
  }));
}
