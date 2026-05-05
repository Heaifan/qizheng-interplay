import type { BushCircle, CoverRect } from './types';

/** 关卡地形数据 — 与几何/渲染解耦，仅描述数据 */

export const COVERS: readonly CoverRect[] = [
  { x: 350, y: 150, w: 120, h: 40 },
  { x: 300, y: 350, w: 40, h: 140 },
  { x: 550, y: 300, w: 100, h: 90 },
] as const;

export const BUSHES: readonly BushCircle[] = [
  { x: 200, y: 150, r: 50 },
  { x: 650, y: 450, r: 65 },
  { x: 450, y: 300, r: 45 },
] as const;
