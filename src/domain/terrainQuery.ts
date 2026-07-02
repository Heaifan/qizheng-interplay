// ============================================================
// terrainQuery — 统一地形查询入口
//
// 所有外部系统（移动、射界、视距）必须通过此模块查询地形，
// 不得直接访问 BattleTerrainMap 的底层数组。
//
// 本轮（v0.6.0-T1）仅定义查询函数，不接入战斗规则。
// ============================================================

import {
  type BattleTerrainMap,
  type TerrainCellInfo,
  NaturalTerrain,
  WaterTerrain,
  VegetationTerrain,
  DerivedTerrain,
} from './terrainMap';

// ─── 坐标换算 ───────────────────────────────────────────────

/** 世界坐标 → 网格列号（向下取整，保证越界返回 -1） */
export function worldToCol(map: BattleTerrainMap, wx: number): number {
  const col = Math.floor(wx / map.cellMeters);
  return col >= 0 && col < map.cols ? col : -1;
}

/** 世界坐标 → 网格行号（向下取整，保证越界返回 -1） */
export function worldToRow(map: BattleTerrainMap, wy: number): number {
  const row = Math.floor(wy / map.cellMeters);
  return row >= 0 && row < map.rows ? row : -1;
}

/** 网格坐标 → 世界坐标（格子中心） */
export function cellToWorld(map: BattleTerrainMap, col: number, row: number): { x: number; y: number } {
  return {
    x: col * map.cellMeters + map.cellMeters / 2,
    y: row * map.cellMeters + map.cellMeters / 2,
  };
}

/** 世界坐标 → 网格坐标（返回 col, row；越界返回 null） */
export function worldToCell(
  map: BattleTerrainMap,
  wx: number,
  wy: number,
): { col: number; row: number } | null {
  const col = worldToCol(map, wx);
  const row = worldToRow(map, wy);
  if (col < 0 || row < 0) return null;
  return { col, row };
}

// ─── 边界检查 ───────────────────────────────────────────────

export function inBounds(map: BattleTerrainMap, col: number, row: number): boolean {
  return col >= 0 && col < map.cols && row >= 0 && row < map.rows;
}

// ─── 单格查询 ───────────────────────────────────────────────

/** 取得指定网格的完整地形信息 */
export function getCellInfo(
  map: BattleTerrainMap,
  col: number,
  row: number,
): TerrainCellInfo | null {
  if (!inBounds(map, col, row)) return null;

  const h = map.height[row][col];
  const nat = map.natural[row][col] as NaturalTerrain;
  const wat = map.water[row][col] as WaterTerrain;
  const veg = map.vegetation[row][col] as VegetationTerrain;

  // 自动派生：水面上不派生 high/slope
  const derived = deriveCellType(map, col, row, wat, h);

  return {
    col,
    row,
    height: h,
    natural: nat,
    water: wat,
    vegetation: veg,
    derived,
  };
}

/** 世界坐标 → 完整地形信息 */
export function getTerrainCell(
  map: BattleTerrainMap,
  wx: number,
  wy: number,
): TerrainCellInfo | null {
  const cell = worldToCell(map, wx, wy);
  if (!cell) return null;
  return getCellInfo(map, cell.col, cell.row);
}

// ─── 图层快捷查询 ───────────────────────────────────────────

/** 世界坐标处的高度 */
export function getHeightAt(map: BattleTerrainMap, wx: number, wy: number): number | null {
  const cell = worldToCell(map, wx, wy);
  if (!cell) return null;
  return map.height[cell.row][cell.col];
}

/** 世界坐标处是否有水体 */
export function isWaterAt(map: BattleTerrainMap, wx: number, wy: number): boolean {
  const cell = worldToCell(map, wx, wy);
  if (!cell) return false;
  return map.water[cell.row][cell.col] > 0;
}

/** 世界坐标处是否有森林 */
export function isForestAt(map: BattleTerrainMap, wx: number, wy: number): boolean {
  const cell = worldToCell(map, wx, wy);
  if (!cell) return false;
  return map.vegetation[cell.row][cell.col] === VegetationTerrain.forest;
}

/** 世界坐标处是否为高地 */
export function isHighAt(map: BattleTerrainMap, wx: number, wy: number): boolean {
  const cell = worldToCell(map, wx, wy);
  if (!cell) return false;
  return map.natural[cell.row][cell.col] === NaturalTerrain.high;
}

// ─── 线段采样 ───────────────────────────────────────────────

/** 线段采样结果 */
export interface SegmentSample {
  /** 采样点总数 */
  count: number;
  /** 经过的水体格数 */
  waterCells: number;
  /** 经过的森林格数 */
  forestCells: number;
  /** 经过的高地格数 */
  highCells: number;
  /** 经过的坡地格数（相邻格高度差 > 阈值） */
  slopeCells: number;
  /** 路径上最低高度 */
  minHeight: number;
  /** 路径上最高高度 */
  maxHeight: number;
  /** 是否经过任何水体 */
  touchesWater: boolean;
  /** 是否经过任何森林 */
  touchesForest: boolean;
  /** 详细步进记录（可选，仅调试用） */
  detail?: Array<{ col: number; row: number; height: number; flags: string }>;
}

/**
 * 沿线段采样地形，返回步进统计结果。
 * 采样步长 = map.cellMeters（每格一步），确保不会跳过窄地形。
 */
export function sampleSegmentTerrain(
  map: BattleTerrainMap,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  includeDetail: boolean = false,
): SegmentSample {
  const step = map.cellMeters;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / step));

  let waterCells = 0;
  let forestCells = 0;
  let highCells = 0;
  let slopeCells = 0;
  let minHeight = Infinity;
  let maxHeight = -Infinity;

  const seen = new Set<number>();
  const detail: SegmentSample['detail'] = [];

  for (let i = 0; i <= steps; i++) {
    const t = steps > 0 ? i / steps : 0;
    const wx = x1 + dx * t;
    const wy = y1 + dy * t;
    const cell = worldToCell(map, wx, wy);
    if (!cell) continue;

    const key = cell.col + cell.row * map.cols;
    if (seen.has(key)) continue;
    seen.add(key);

    const info = getCellInfo(map, cell.col, cell.row);
    if (!info) continue;

    minHeight = Math.min(minHeight, info.height);
    maxHeight = Math.max(maxHeight, info.height);

    if (info.water > 0) waterCells++;
    if (info.vegetation === VegetationTerrain.forest) forestCells++;
    if (info.natural === NaturalTerrain.high) highCells++;
    if (info.derived === DerivedTerrain.slope) slopeCells++;

    if (includeDetail) {
      const flags: string[] = [];
      if (info.water > 0) flags.push('W');
      if (info.vegetation === VegetationTerrain.forest) flags.push('F');
      if (info.natural === NaturalTerrain.high) flags.push('H');
      if (info.derived === DerivedTerrain.slope) flags.push('S');
      detail.push({
        col: cell.col,
        row: cell.row,
        height: info.height,
        flags: flags.join('') || '-',
      });
    }
  }

  return {
    count: seen.size,
    waterCells,
    forestCells,
    highCells,
    slopeCells,
    minHeight: minHeight === Infinity ? 0 : minHeight,
    maxHeight: maxHeight === -Infinity ? 0 : maxHeight,
    touchesWater: waterCells > 0,
    touchesForest: forestCells > 0,
    ...(includeDetail ? { detail } : {}),
  };
}

// ─── 内部辅助 ───────────────────────────────────────────────

/**
 * 根据高度和水体自动判断该格的派生地貌类型。
 * - 水体 → DerivedTerrain.none
 * - 相邻格高度差 > 阈值 → DerivedTerrain.slope
 * - 高度 > 全局阈值（由 deriveTerrain 决定） → DerivedTerrain.high
 * - 高度 < 低地阈值 → DerivedTerrain.low
 * - 其余 → DerivedTerrain.none
 *
 * 注：此函数是本地简易派发，全图派生应由 deriveTerrain() 统一计算后写入 derived 字段。
 */
const SLOPE_THRESHOLD = 0.06;

function deriveCellType(
  map: BattleTerrainMap,
  col: number,
  row: number,
  water: number,
  h: number,
): DerivedTerrain {
  // 水体
  if (water > 0) return DerivedTerrain.none;

  // 坡地检测（检查四邻域高度差）
  const neighbors = [
    [col - 1, row], [col + 1, row],
    [col, row - 1], [col, row + 1],
  ];
  for (const [nc, nr] of neighbors) {
    if (!inBounds(map, nc, nr)) continue;
    if (Math.abs(h - map.height[nr][nc]) > SLOPE_THRESHOLD) {
      return DerivedTerrain.slope;
    }
  }

  // 以下由 naturalMap 反推：high → DerivedTerrain.high；其余归 none
  // low 通过外部 deriveTerrain 统一计算后写入 derived.low
  if (map.natural[row][col] === NaturalTerrain.high) {
    return DerivedTerrain.high;
  }

  return DerivedTerrain.none;
}
