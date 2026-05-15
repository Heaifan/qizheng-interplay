import type { EffectClass } from './types';
import type { TargetEffectVector } from './fireOutput';

export const EFFECT_CLASS_BASE: Record<EffectClass, TargetEffectVector> = {
  pistol_round: {
    personnel: 0.45, lightVehicle: 0.05, armor: 0, structure: 0, obstacle: 0,
  },
  submachinegun_round: {
    personnel: 0.5, lightVehicle: 0.05, armor: 0, structure: 0, obstacle: 0,
  },
  intermediate_rifle: {
    personnel: 0.75, lightVehicle: 0.12, armor: 0, structure: 0.02, obstacle: 0.02,
  },
  full_power_rifle: {
    personnel: 1.0, lightVehicle: 0.2, armor: 0.01, structure: 0.04, obstacle: 0.03,
  },
  heavy_machinegun_round: {
    personnel: 1.35, lightVehicle: 0.55, armor: 0.15, structure: 0.12, obstacle: 0.1,
  },
  small_autocannon: {
    personnel: 1.8, lightVehicle: 0.9, armor: 0.3, structure: 0.25, obstacle: 0.22,
  },
  medium_autocannon: {
    personnel: 2.3, lightVehicle: 1.3, armor: 0.55, structure: 0.4, obstacle: 0.35,
  },
  tank_kinetic: {
    personnel: 2.0, lightVehicle: 1.8, armor: 1.4, structure: 0.55, obstacle: 0.45,
  },
  small_grenade: {
    personnel: 1.2, lightVehicle: 0.25, armor: 0.02, structure: 0.2, obstacle: 0.15,
  },
  medium_grenade: {
    personnel: 1.45, lightVehicle: 0.35, armor: 0.03, structure: 0.3, obstacle: 0.25,
  },
  light_mortar_shell: {
    personnel: 1.6, lightVehicle: 0.45, armor: 0.05, structure: 0.35, obstacle: 0.3,
  },
  medium_mortar_shell: {
    personnel: 2.1, lightVehicle: 0.7, armor: 0.08, structure: 0.55, obstacle: 0.45,
  },
  heavy_mortar_shell: {
    personnel: 2.7, lightVehicle: 1.0, armor: 0.12, structure: 0.75, obstacle: 0.65,
  },
  field_artillery_shell: {
    personnel: 3.2, lightVehicle: 1.3, armor: 0.2, structure: 1.2, obstacle: 1.0,
  },
  heavy_artillery_shell: {
    personnel: 4.5, lightVehicle: 1.8, armor: 0.35, structure: 1.8, obstacle: 1.6,
  },
  anti_tank_rifle: {
    personnel: 1.2, lightVehicle: 0.8, armor: 0.35, structure: 0.08, obstacle: 0.06,
  },
  light_at_gun: {
    personnel: 1.5, lightVehicle: 1.2, armor: 0.7, structure: 0.2, obstacle: 0.15,
  },
  medium_at_gun: {
    personnel: 1.8, lightVehicle: 1.5, armor: 1.0, structure: 0.35, obstacle: 0.28,
  },
  heavy_at_gun: {
    personnel: 2.1, lightVehicle: 1.8, armor: 1.35, structure: 0.45, obstacle: 0.35,
  },
  shaped_charge_light: {
    personnel: 1.4, lightVehicle: 1.2, armor: 0.85, structure: 0.35, obstacle: 0.3,
  },
  shaped_charge_medium: {
    personnel: 1.7, lightVehicle: 1.5, armor: 1.15, structure: 0.5, obstacle: 0.45,
  },
  shaped_charge_heavy: {
    personnel: 2.0, lightVehicle: 1.8, armor: 1.45, structure: 0.7, obstacle: 0.65,
  },
  anti_personnel_mine: {
    personnel: 1.3, lightVehicle: 0.1, armor: 0, structure: 0, obstacle: 0.2,
  },
  anti_tank_mine: {
    personnel: 1.0, lightVehicle: 1.8, armor: 1.3, structure: 0.2, obstacle: 0.5,
  },
  molotov: {
    personnel: 0.8, lightVehicle: 0.6, armor: 0.1, structure: 0.35, obstacle: 0.2,
  },
  flamethrower_light: {
    personnel: 1.8, lightVehicle: 0.9, armor: 0.25, structure: 1.1, obstacle: 0.6,
  },
  flamethrower_heavy: {
    personnel: 2.3, lightVehicle: 1.1, armor: 0.35, structure: 1.5, obstacle: 0.8,
  },
  white_phosphorus: {
    personnel: 2.0, lightVehicle: 0.9, armor: 0.2, structure: 1.0, obstacle: 0.65,
  },
  demolition_charge_light: {
    personnel: 1.3, lightVehicle: 0.7, armor: 0.15, structure: 1.2, obstacle: 1.3,
  },
  demolition_charge_medium: {
    personnel: 1.8, lightVehicle: 1.0, armor: 0.25, structure: 1.8, obstacle: 1.9,
  },
  demolition_charge_heavy: {
    personnel: 2.5, lightVehicle: 1.4, armor: 0.4, structure: 2.5, obstacle: 2.6,
  },
  satchel_charge: {
    personnel: 2.0, lightVehicle: 1.2, armor: 0.35, structure: 2.0, obstacle: 2.1,
  },
  bangalore_torpedo: {
    personnel: 1.0, lightVehicle: 0.6, armor: 0.1, structure: 1.2, obstacle: 2.3,
  },
};

export interface RangeBand {
  id: RangeBandId;
  min: number;
  max: number;
  factor: number;
}

export type RangeBandId =
  | 'point_blank'
  | 'short'
  | 'medium'
  | 'long'
  | 'extreme';

export const KINETIC_RANGE_FACTORS: readonly RangeBand[] = [
  { id: 'point_blank', min: 0, max: 50, factor: 1.0 },
  { id: 'short', min: 50, max: 150, factor: 0.95 },
  { id: 'medium', min: 150, max: 300, factor: 0.9 },
  { id: 'long', min: 300, max: 500, factor: 0.75 },
  { id: 'extreme', min: 500, max: Infinity, factor: 0.55 },
] as const;

export const EXPLOSIVE_DISTANCE_FACTORS: readonly RangeBand[] = [
  { id: 'point_blank', min: 0, max: 10, factor: 1.0 },
  { id: 'short', min: 10, max: 30, factor: 0.8 },
  { id: 'medium', min: 30, max: 60, factor: 0.55 },
  { id: 'long', min: 60, max: 100, factor: 0.35 },
  { id: 'extreme', min: 100, max: Infinity, factor: 0.2 },
] as const;

export const SHAPED_CHARGE_RANGE_FACTORS: readonly RangeBand[] = [
  { id: 'point_blank', min: 0, max: 50, factor: 1.0 },
  { id: 'short', min: 50, max: 200, factor: 0.95 },
  { id: 'medium', min: 200, max: 500, factor: 0.85 },
  { id: 'long', min: 500, max: 1000, factor: 0.7 },
  { id: 'extreme', min: 1000, max: Infinity, factor: 0.5 },
] as const;

export const INCENDIARY_COVERAGE_FACTORS: readonly RangeBand[] = [
  { id: 'point_blank', min: 0, max: 10, factor: 1.0 },
  { id: 'short', min: 10, max: 25, factor: 0.85 },
  { id: 'medium', min: 25, max: 50, factor: 0.6 },
  { id: 'long', min: 50, max: 100, factor: 0.3 },
  { id: 'extreme', min: 100, max: Infinity, factor: 0.1 },
] as const;

export const TRIGGERED_EXPLOSIVE_FACTORS: readonly RangeBand[] = [
  { id: 'point_blank', min: 0, max: Infinity, factor: 1.0 },
] as const;

export const DEMOLITION_DISTANCE_FACTORS: readonly RangeBand[] = [
  { id: 'point_blank', min: 0, max: Infinity, factor: 1.0 },
] as const;

export const RANGE_FACTORS_BY_OUTPUT_MODE: Record<string, readonly RangeBand[]> = {
  kinetic_single: KINETIC_RANGE_FACTORS,
  kinetic_burst: KINETIC_RANGE_FACTORS,
  kinetic_auto: KINETIC_RANGE_FACTORS,
  kinetic_penetrator: KINETIC_RANGE_FACTORS,
  explosive_fragmentation: EXPLOSIVE_DISTANCE_FACTORS,
  indirect_explosive: EXPLOSIVE_DISTANCE_FACTORS,
  shaped_charge: SHAPED_CHARGE_RANGE_FACTORS,
  incendiary_area: INCENDIARY_COVERAGE_FACTORS,
  triggered_explosive: TRIGGERED_EXPLOSIVE_FACTORS,
  demolition_blast: DEMOLITION_DISTANCE_FACTORS,
};

export function getRangeFactorsByOutputMode(outputMode: string): readonly RangeBand[] {
  return RANGE_FACTORS_BY_OUTPUT_MODE[outputMode] ?? KINETIC_RANGE_FACTORS;
}

export type ProtectionLevel =
  | 'none'
  | 'light_cover'
  | 'medium_cover'
  | 'heavy_cover'
  | 'fortified'
  | 'armored';

export const PROTECTION_FACTORS: Record<ProtectionLevel, number> = {
  none: 1.0,
  light_cover: 0.75,
  medium_cover: 0.5,
  heavy_cover: 0.3,
  fortified: 0.15,
  armored: 0.05,
};
