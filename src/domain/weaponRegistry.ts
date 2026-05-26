import builtinWeapons from '@/data/weapons/builtin.weapons.json';
import type { WeaponProfile } from './types';

const weapons = new Map<string, WeaponProfile>();
let initialized = false;

function normalize(raw: WeaponProfile): WeaponProfile {
  return {
    ...raw,
    displayName: raw.displayName ?? raw.name,
    shortName: raw.shortName ?? raw.displayName ?? raw.name,
  };
}

export function registerWeapon(w: WeaponProfile): void {
  const norm = normalize(w);
  if (weapons.has(norm.id)) {
    console.warn(`[WeaponRegistry] duplicate weapon id: ${norm.id}`);
  }
  weapons.set(norm.id, norm);
}

export function registerWeapons(list: readonly WeaponProfile[]): void {
  for (const w of list) registerWeapon(w);
}

export function initWeaponRegistry(): void {
  if (initialized) return;
  initialized = true;
  registerWeapons(builtinWeapons as WeaponProfile[]);
}

export function getWeaponById(id?: string): WeaponProfile | undefined {
  if (!id) return undefined;
  initWeaponRegistry();
  return weapons.get(id);
}

export function listWeapons(): WeaponProfile[] {
  initWeaponRegistry();
  return Array.from(weapons.values());
}
