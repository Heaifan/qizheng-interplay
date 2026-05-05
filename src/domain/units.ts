import type { RuntimeUnit, UnitTemplate } from './types';

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

/** 由模板生成运行时单位 — 工厂职责 */
export function createRuntimeUnitsFromTemplates(templates: readonly UnitTemplate[]): RuntimeUnit[] {
  return templates.map((t) => ({
    ...t,
    x: t.startX,
    y: t.startY,
    hp: 100,
    dead: false,
    path: [],
    currentPathIdx: 0,
    angle: t.type === 'circle' ? 0 : Math.PI,
    lastFireTime: 0,
  }));
}
