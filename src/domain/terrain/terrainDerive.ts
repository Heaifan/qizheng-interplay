// ============================================================
// terrainDerive — 派生地貌预计算
//
// 根据 height / natural 图层预填充 map.derived.high/slope/low。
// terrainMap.ts 约定：derived 由 deriveTerrain 在运行时填充。
// getCellInfo 优先读取预计算值，缺省回退实时推算（见 terrainCellInfo.ts）。
// ============================================================

import {
  type BattleTerrainMap,
  NaturalTerrain,
  DerivedTerrain,
} from '../terrainMap';
import { inBounds } from './terrainCoord';

const SLOPE_THRESHOLD = 0.06;
const LOW_REFERENCE = 0.35;

/** 单格派生地貌：坡度优先于高地，低地取低于基准的凹陷 */
export function computeDerivedAt(
  map: BattleTerrainMap,
  col: number,
  row: number,
): DerivedTerrain {
  const h = map.height[row][col];
  if (map.water[row][col] > 0) return DerivedTerrain.none;
  const neighbors = [[col - 1, row], [col + 1, row], [col, row - 1], [col, row + 1]];
  for (const [nc, nr] of neighbors) {
    if (!inBounds(map, nc, nr)) continue;
    if (Math.abs(h - map.height[nr][nc]) > SLOPE_THRESHOLD) return DerivedTerrain.slope;
  }
  if (map.natural[row][col] === NaturalTerrain.high) return DerivedTerrain.high;
  if (h < LOW_REFERENCE) return DerivedTerrain.low;
  return DerivedTerrain.none;
}

/** 从 height / natural 预计算整张派生地形 */
export function deriveTerrain(map: BattleTerrainMap): BattleTerrainMap {
  const high: number[][] = [];
  const slope: number[][] = [];
  const low: number[][] = [];
  for (let r = 0; r < map.rows; r++) {
    high[r] = []; slope[r] = []; low[r] = [];
    for (let c = 0; c < map.cols; c++) {
      const d = computeDerivedAt(map, c, r);
      high[r][c] = d === DerivedTerrain.high ? 1 : 0;
      slope[r][c] = d === DerivedTerrain.slope ? 1 : 0;
      low[r][c] = d === DerivedTerrain.low ? 1 : 0;
    }
  }
  return { ...map, derived: { high, slope, low } };
}

/** 从预计算 derived 图层还原单格枚举（坡度优先于高地） */
export function reconstructDerived(
  derived: NonNullable<BattleTerrainMap['derived']>,
  row: number,
  col: number,
): DerivedTerrain {
  if (derived.slope?.[row]?.[col]) return DerivedTerrain.slope;
  if (derived.high?.[row]?.[col]) return DerivedTerrain.high;
  if (derived.low?.[row]?.[col]) return DerivedTerrain.low;
  return DerivedTerrain.none;
}
