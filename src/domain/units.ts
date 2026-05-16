import type { CombatProfile, RuntimeUnit, UnitTemplate } from './types';
import { getWeaponById } from './weaponCatalog';
import { createWeaponRuntimeState } from '@/game/weaponRuntime';

export const UNIT_TEMPLATES: readonly UnitTemplate[] = [
  {
    id: '蓝方',
    type: 'circle',
    startX: 150,
    startY: 300,
    color: '#8FC6E0',
    stroke: '#4A7EA8',
  },
  {
    id: '红方',
    type: 'diamond',
    startX: 650,
    startY: 300,
    color: '#E2A099',
    stroke: '#B85A4D',
  },
] as const;

const BLUE_PROFILE: CombatProfile = {
  id: '蓝方-profile',
  name: '德军步枪手',
  faction: 'blue',
  states: { stamina: 70, morale: 75, focus: 65 },
  forces: { strike: 70, survival: 65, mobility: 60, perception: 60, control: 75, sustainment: 55 },
  weapon: {
    id: 'kar98k',
    name: 'Kar98k',
    caliber: 7.92,
    action: 'bolt',
    barrelLength: 600,
    sightMag: 1.0,
    category: 'rifle',
    family: 'bolt_action_rifle',
    outputMode: 'kinetic_single',
    effectClass: 'full_power_rifle',
    outputProfileId: 'full_power_rifle_direct',
    tags: ['direct_fire', 'bolt_action', 'rifle'],
  },
  woundState: 'healthy',
};

const RED_PROFILE: CombatProfile = {
  id: '红方-profile',
  name: '苏军步枪手',
  faction: 'red',
  states: { stamina: 60, morale: 50, focus: 50 },
  forces: { strike: 60, survival: 55, mobility: 50, perception: 50, control: 45, sustainment: 45 },
  weapon: {
    id: 'm91-30',
    name: 'M91/30',
    caliber: 7.62,
    action: 'bolt',
    barrelLength: 730,
    sightMag: 1.0,
    category: 'rifle',
    family: 'bolt_action_rifle',
    outputMode: 'kinetic_single',
    effectClass: 'full_power_rifle',
    outputProfileId: 'full_power_rifle_direct',
    tags: ['direct_fire', 'bolt_action', 'rifle'],
  },
  woundState: 'healthy',
};

const DEFAULT_PROFILES: Record<string, CombatProfile> = {
  '蓝方': BLUE_PROFILE,
  '红方': RED_PROFILE,
};

/** 由模板生成运行时单位 — 工厂职责 */
export function createRuntimeUnitsFromTemplates(templates: readonly UnitTemplate[]): RuntimeUnit[] {
  return templates.map((t) => {
    const profile = DEFAULT_PROFILES[t.id] ?? BLUE_PROFILE;
    return {
      ...t,
      x: t.startX,
      y: t.startY,
      hp: 100,
      dead: false,
      path: [],
      currentPathIdx: 0,
      angle: t.type === 'circle' ? 0 : Math.PI,
      aimAngle: t.type === 'circle' ? 0 : Math.PI,
      fireAngle: t.type === 'circle' ? 0 : Math.PI,
      lastFireTime: 0,
      weaponId: profile.weapon.id,
      maxSpeedKmh: 6,
      currentSpeedKmh: 0,
      formationType: 'single',
      weaponState: createWeaponRuntimeState(profile.weapon.id),
      combatProfile: structuredClone(profile),
    };
  });
}
