// ============================================================
// terrainQuery — 统一地形查询入口（兼容门面）
//
// 重新导出 terrain/ 子模块的所有公开函数，保持外部导入路径兼容。
// 新增外部代码建议按需导入 terrain/ 下具体模块。
//
// 导出来源：
//   terrainCoord.ts        — 坐标换算
//   terrainCellQuery.ts    — 单格查询
//   terrainSegmentSample.ts — 线段采样
// ============================================================

// ─── 坐标换算 ───────────────────────────────────────────────
export {
  worldToCol,
  worldToRow,
  worldToCell,
  cellToWorld,
  inBounds,
} from './terrain/terrainCoord';

// ─── 单格查询 ───────────────────────────────────────────────
export {
  getCellInfo,
  getTerrainCell,
  getHeightAt,
  isWaterAt,
  isForestAt,
  isHighAt,
} from './terrain/terrainCellQuery';

// ─── 线段采样 ───────────────────────────────────────────────
export {
  sampleSegmentTerrain,
} from './terrain/terrainSegmentSample';

export type { SegmentSample } from './terrain/terrainSegmentSample';
