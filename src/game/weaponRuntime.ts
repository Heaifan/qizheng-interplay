import type { WeaponRuntimeState, RuntimeUnit } from '@/domain/types';
import { getWeaponById } from '@/domain/weaponRegistry';

export function createWeaponRuntimeState(weaponId: string): WeaponRuntimeState {
  const weapon = getWeaponById(weaponId);
  return {
    weaponId,
    ammoInMagazine: weapon?.magazineSize ?? 5,
    reserveAmmo: 999,
    isReloading: false,
    reloadFinishAtMs: 0,
    nextShotAtMs: 0,
  };
}

export interface FireCycleResult {
  canFire: boolean;
  reason: string;
  rounds?: number;
}

/** 检查能否开火并消耗弹药，返回是否可射击及发数 */
export function tryConsumeShot(
  unit: RuntimeUnit,
  now: number,
): FireCycleResult {
  const weapon = getWeaponById(unit.weaponId);
  const state = unit.weaponState;
  if (!weapon || !state) return { canFire: false, reason: 'no_weapon' };

  // Reload check
  if (state.isReloading) {
    if (now >= state.reloadFinishAtMs) {
      state.isReloading = false;
      state.ammoInMagazine = weapon.magazineSize ?? 1;
    } else {
      return { canFire: false, reason: 'reloading' };
    }
  }

  // Ammo check — auto-reload if empty
  if (state.ammoInMagazine <= 0) {
    state.isReloading = true;
    state.reloadFinishAtMs = now + (weapon.reloadTimeMs ?? 3000);
    return { canFire: false, reason: 'start_reload' };
  }

  // Cooldown check
  if (now < state.nextShotAtMs) {
    return { canFire: false, reason: 'cooldown' };
  }

  // Determine rounds for this fire event
  const auto = weapon.fireMode === 'auto' || weapon.fireMode === 'burst';
  const rounds = auto ? (weapon.burstSize ?? 3) : 1;
  const consume = Math.min(rounds, state.ammoInMagazine);
  state.ammoInMagazine -= consume;

  // Set next shot time (burst interval for auto, shot interval for single)
  const interval = weapon.shotIntervalMs ?? 1000;
  state.nextShotAtMs = now + interval;

  return { canFire: true, reason: 'fire', rounds: consume };
}
