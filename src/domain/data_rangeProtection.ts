export interface RangeBand {
  id: RangeBandId;
  min: number;
  max: number;
  factor: number;
}

export type RangeBandId =
  | 'point_blank' | 'short' | 'medium' | 'long' | 'extreme';

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
  | 'none' | 'light_cover' | 'medium_cover' | 'heavy_cover' | 'fortified' | 'armored';

export const PROTECTION_FACTORS: Record<ProtectionLevel, number> = {
  none: 1.0,
  light_cover: 0.75,
  medium_cover: 0.5,
  heavy_cover: 0.3,
  fortified: 0.15,
  armored: 0.05,
};
