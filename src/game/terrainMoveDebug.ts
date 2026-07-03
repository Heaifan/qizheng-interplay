// ============================================================
// terrainMoveDebug — 移动地形调试输出
//
// 格式化中文移动地形日志，不侵入 movement 主流程。
// ============================================================

import type { TerrainCellInfo } from '@/domain/terrainMap';
import { NaturalTerrain, WaterTerrain, VegetationTerrain, DerivedTerrain } from '@/domain/terrainMap';

const NAT_LABEL: Record<number, string> = {
  [NaturalTerrain.none]: '无', [NaturalTerrain.grass]: '草地',
  [NaturalTerrain.dirt]: '泥地', [NaturalTerrain.high]: '高地',
};
const WAT_LABEL: Record<number, string> = {
  [WaterTerrain.none]: '无', [WaterTerrain.river]: '河流', [WaterTerrain.lake]: '湖泊',
};
const VEG_LABEL: Record<number, string> = {
  [VegetationTerrain.none]: '无', [VegetationTerrain.forest]: '森林', [VegetationTerrain.bush]: '灌木',
};
const DER_LABEL: Record<number, string> = {
  [DerivedTerrain.none]: '无', [DerivedTerrain.high]: '高地',
  [DerivedTerrain.slope]: '坡地', [DerivedTerrain.low]: '低地',
};

export interface MoveDebugInfo {
  unitId: string;
  nextX: number;
  nextY: number;
  cell: TerrainCellInfo | null;
  factor: number;
  blocked: boolean;
}

export function formatMoveDebug(info: MoveDebugInfo): string {
  const { unitId, nextX, nextY, cell, factor, blocked } = info;
  const lines: string[] = [
    `[移动地形]`,
    `单位：${unitId}`,
    `下一点：${Math.round(nextX)},${Math.round(nextY)}`,
  ];
  if (cell) {
    lines.push(`自然地表：${NAT_LABEL[cell.natural] ?? cell.natural}`);
    lines.push(`水体：${WAT_LABEL[cell.water] ?? cell.water}`);
    lines.push(`植被：${VEG_LABEL[cell.vegetation] ?? cell.vegetation}`);
    lines.push(`派生：${DER_LABEL[cell.derived] ?? cell.derived}`);
  }
  lines.push(`速度系数：${factor.toFixed(2)}`);
  lines.push(`结果：${blocked ? '🚫 阻挡，停止移动' : factor < 1 ? '减速移动' : '正常移动'}`);
  return lines.join('\n');
}
