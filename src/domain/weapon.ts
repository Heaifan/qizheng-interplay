import type { WeaponProfile, WeaponDerivedStats } from './types';

const ACTION_RPM: Record<WeaponProfile['action'], number> = {
  bolt: 15,
  semi: 40,
  auto: 120,
};

export function deriveWeaponStats(w: WeaponProfile): WeaponDerivedStats {
  const actionRPM = ACTION_RPM[w.action];
  return {
    accuracy: 0.4 + w.barrelLength / 2000 + (w.sightMag - 1) * 0.05,
    effectiveRange: (w.caliber * w.barrelLength) / 7,
    fireIntervalMs: 60000 / actionRPM,
    lethality: w.caliber,
    actionRPM,
  };
}
