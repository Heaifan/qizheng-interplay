import type { WeaponProfile } from './types';

/**
 * 全陆军武器目录。
 * 武器从单位结构中解耦，单位通过 weaponId 引用。
 */
export const WEAPON_CATALOG: WeaponProfile[] = [
  // ── 栓动步枪 ──
  {
    id: 'kar98k', name: 'Kar98k', caliber: 7.92, action: 'bolt',
    barrelLength: 600, sightMag: 1.0,
    category: 'rifle', family: 'bolt_action_rifle',
    outputMode: 'kinetic_single', effectClass: 'full_power_rifle',
    outputProfileId: 'full_power_rifle_direct',
    tags: ['direct_fire', 'bolt_action', 'rifle'],
  },
  {
    id: 'm91-30', name: 'M91/30 莫辛纳甘', displayName: 'M91/30', caliber: 7.62, action: 'bolt',
    barrelLength: 730, sightMag: 1.0,
    category: 'rifle', family: 'bolt_action_rifle',
    outputMode: 'kinetic_single', effectClass: 'full_power_rifle',
    outputProfileId: 'full_power_rifle_direct',
    tags: ['direct_fire', 'bolt_action', 'rifle'],
  },
  {
    id: 'type-38', name: '三八式步枪', caliber: 6.5, action: 'bolt',
    barrelLength: 797, sightMag: 1.0,
    category: 'rifle', family: 'bolt_action_rifle',
    outputMode: 'kinetic_single', effectClass: 'full_power_rifle',
    outputProfileId: 'full_power_rifle_direct',
    tags: ['direct_fire', 'bolt_action', 'rifle'],
  },

  // ── 半自动步枪 ──
  {
    id: 'm1-garand', name: 'M1 加兰德', caliber: 7.62, action: 'semi',
    barrelLength: 610, sightMag: 1.0,
    category: 'rifle', family: 'semi_auto_rifle',
    outputMode: 'kinetic_single', effectClass: 'full_power_rifle',
    outputProfileId: 'full_power_rifle_direct',
    tags: ['direct_fire', 'semi_auto', 'rifle'],
  },

  // ── 冲锋枪 ──
  {
    id: 'mp40', name: 'MP40', caliber: 9, action: 'auto',
    barrelLength: 251, sightMag: 1.0,
    category: 'rifle', family: 'submachine_gun',
    outputMode: 'kinetic_auto', effectClass: 'submachinegun_round',
    outputProfileId: 'full_power_rifle_direct',
    tags: ['direct_fire', 'auto', 'smg'],
  },
  {
    id: 'ppsh-41', name: 'PPSh-41', caliber: 7.62, action: 'auto',
    barrelLength: 269, sightMag: 1.0,
    category: 'rifle', family: 'submachine_gun',
    outputMode: 'kinetic_auto', effectClass: 'submachinegun_round',
    outputProfileId: 'full_power_rifle_direct',
    tags: ['direct_fire', 'auto', 'smg'],
  },

  // ── 轻机枪 ──
  {
    id: 'mg34', name: 'MG34', caliber: 7.92, action: 'auto',
    barrelLength: 627, sightMag: 1.5,
    category: 'machine_gun', family: 'light_machine_gun',
    outputMode: 'kinetic_auto', effectClass: 'full_power_rifle',
    outputProfileId: 'full_power_rifle_direct',
    tags: ['direct_fire', 'auto', 'machine_gun'],
  },
  {
    id: 'zb26', name: 'ZB26 捷克式', caliber: 7.92, action: 'auto',
    barrelLength: 672, sightMag: 1.0,
    category: 'machine_gun', family: 'light_machine_gun',
    outputMode: 'kinetic_auto', effectClass: 'full_power_rifle',
    outputProfileId: 'full_power_rifle_direct',
    tags: ['direct_fire', 'auto', 'machine_gun'],
  },
];

/** 按 ID 查找武器 */
export function getWeaponById(id: string): WeaponProfile | undefined {
  return WEAPON_CATALOG.find((w) => w.id === id);
}
