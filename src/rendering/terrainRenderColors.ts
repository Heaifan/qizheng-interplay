// ============================================================
// terrainRenderColors — 地形渲染配色
//
// 每个地貌类型的绘制颜色集中定义，渲染层函数直接引用。
// ============================================================

import { WaterTerrain, VegetationTerrain, DerivedTerrain } from '@/domain/terrainMap';

/** 高度底色 — 根据高度 0~1 插值 */
export function heightTint(h: number): string {
  const r = Math.round(160 + h * 60);       // 低→高: a0 → dc
  const g = Math.round(190 - h * 40);        // 低→高: be → 96
  const b = Math.round(110 - h * 30);        // 低→高: 6e → 50
  return `rgb(${r},${g},${b})`;
}

export const WATER_COLORS: Record<number, string> = {
  [WaterTerrain.river]: 'rgba(76,149,189,0.55)',
  [WaterTerrain.lake]:  'rgba(91,159,196,0.50)',
};

export const VEGETATION_COLORS: Record<number, string> = {
  [VegetationTerrain.forest]: 'rgba(88,125,78,0.40)',
  [VegetationTerrain.bush]:   'rgba(127,163,106,0.35)',
};

export const DERIVED_COLORS: Record<number, string> = {
  [DerivedTerrain.high]:  'rgba(210,190,140,0.18)',
  [DerivedTerrain.slope]: 'rgba(160,140,110,0.12)',
  [DerivedTerrain.low]:   'rgba(130,160,120,0.10)',
};

export const GRID_COLOR_MAIN  = 'rgba(50,65,45,0.10)';
export const GRID_COLOR_FINE = 'rgba(50,65,45,0.04)';
