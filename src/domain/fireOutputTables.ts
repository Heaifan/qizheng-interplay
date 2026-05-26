// Barrel — re-exports from split data files
export { EFFECT_CLASS_BASE } from './data_effectClassBase';
export type { RangeBand, RangeBandId, ProtectionLevel } from './data_rangeProtection';
export {
  KINETIC_RANGE_FACTORS, EXPLOSIVE_DISTANCE_FACTORS,
  SHAPED_CHARGE_RANGE_FACTORS, INCENDIARY_COVERAGE_FACTORS,
  TRIGGERED_EXPLOSIVE_FACTORS, DEMOLITION_DISTANCE_FACTORS,
  RANGE_FACTORS_BY_OUTPUT_MODE, PROTECTION_FACTORS,
  getRangeFactorsByOutputMode,
} from './data_rangeProtection';
