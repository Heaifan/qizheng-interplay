// ============================================================
// BattleTerrainMap — 战斗侧地形数据模型
//
// 对标 QZ v0.5 地貌地图数据结构，承载从地图编辑器导出的
// heightMap / naturalMap / waterMap / vegetationMap 等图层。
//
// 本轮（v0.6.0-T1）仅定义存储格式，不接入战斗规则。
// ============================================================

/** 自然地表类型 */
export enum NaturalTerrain {
  none  = 0,
  grass = 1,
  dirt  = 2,
  high  = 3,
}

/** 水体类型 */
export enum WaterTerrain {
  none  = 0,
  river = 1,
  lake  = 2,
}

/** 植被类型 */
export enum VegetationTerrain {
  none   = 0,
  forest = 1,
  bush   = 2,
}

/** 派生地貌类型（由高度/坡度自动计算） */
export enum DerivedTerrain {
  none   = 0,
  high   = 1,
  slope  = 2,
  low    = 3,
}

/**
 * 单格地形查询结果
 * 由 terrainQuery.getTerrainCell 统一返回，外部不应直接读数组。
 */
export interface TerrainCellInfo {
  col: number;
  row: number;
  height: number;
  natural: NaturalTerrain;
  water: WaterTerrain;
  vegetation: VegetationTerrain;
  derived: DerivedTerrain;
}

/**
 * 战斗侧地形主数据
 *
 * 字段说明：
 *   version     — 数据格式版本标识，当前 'qz-terrain-v1'
 *   cols, rows  — 网格列数（x）、行数（y）
 *   cellMeters  — 每格对应世界米数
 *   height      — 高度图层，height[row][col]，范围 0~1
 *   natural     — 自然地表图层，natural[row][col] 取值 NaturalTerrain
 *   water       — 水体图层，water[row][col] 取值 WaterTerrain
 *   vegetation  — 植被图层，vegetation[row][col] 取值 VegetationTerrain
 *   derived     — 派生地貌（可选），运行前由 deriveTerrain 填充
 */
export interface BattleTerrainMap {
  version: 'qz-terrain-v1';

  cols: number;
  rows: number;

  /** 每格对应世界坐标的米数 */
  cellMeters: number;

  /** 高度图 height[row][col]，值域 [0, 1] */
  height: number[][];

  /** 自然地表 natural[row][col]，值域 NaturalTerrain */
  natural: number[][];

  /** 水体 water[row][col]，值域 WaterTerrain */
  water: number[][];

  /** 植被 vegetation[row][col]，值域 VegetationTerrain */
  vegetation: number[][];

  /** 派生地貌（运行前预计算） */
  derived?: {
    high?:  number[][];
    slope?: number[][];
    low?:   number[][];
  };
}

/**
 * 创建一张空地图（全部初始化为 0/none）
 */
export function createEmptyTerrainMap(
  cols: number,
  rows: number,
  cellMeters: number = 10,
): BattleTerrainMap {
  const make = (): number[][] =>
    Array.from({ length: rows }, () => Array(cols).fill(0));

  const height: number[][] = Array.from(
    { length: rows },
    () => Array(cols).fill(0.45),
  );

  return {
    version: 'qz-terrain-v1',
    cols,
    rows,
    cellMeters,
    height,
    natural: make(),
    water: make(),
    vegetation: make(),
  };
}

/**
 * 深拷贝一张 BattleTerrainMap（确保派生数据也被复制）
 */
export function cloneTerrainMap(map: BattleTerrainMap): BattleTerrainMap {
  const clone = <T>(src: T): T =>
    JSON.parse(JSON.stringify(src)) as T;

  return {
    ...map,
    height:     clone(map.height),
    natural:    clone(map.natural),
    water:      clone(map.water),
    vegetation: clone(map.vegetation),
    derived:    map.derived ? clone(map.derived) : undefined,
  };
}
