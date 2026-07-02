// ============================================================
// terrainCellQuery — 单格地形查询（兼容门面）
//
// 重新导出 terrainCellInfo + terrainCellFlags 的所有函数。
// ============================================================

export {
  getCellInfo,
  getTerrainCell,
} from './terrainCellInfo';

export {
  getHeightAt,
  isWaterAt,
  isForestAt,
  isHighAt,
} from './terrainCellFlags';
