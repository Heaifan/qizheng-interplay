import type { CombatProfile, RuntimeUnit, UnitTemplate } from './types';

export const UNIT_TEMPLATES: readonly UnitTemplate[] = [
  {
    id: '蓝方',
    type: 'circle',
    startX: 150,
    startY: 300,
    color: '#81d4fa',
    stroke: '#0288d1',
  },
  {
    id: '红方',
    type: 'diamond',
    startX: 650,
    startY: 300,
    color: '#ef9a9a',
    stroke: '#d32f2f',
  },
] as const;

const BLUE_PROFILE: CombatProfile = {
  id: '蓝方-profile',
  name: '德军步兵班 1941',
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
  },
  woundState: 'healthy',
};

const RED_PROFILE: CombatProfile = {
  id: '红方-profile',
  name: '苏军步兵班 1941',
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
      fireAngle: t.type === 'circle' ? 0 : Math.PI,
      lastFireTime: 0,
      combatProfile: structuredClone(profile),
    };
  });
}
