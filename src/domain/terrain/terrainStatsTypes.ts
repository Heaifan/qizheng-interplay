// ============================================================
// terrainStatsTypes — 统计结果类型定义
// ============================================================

export interface TerrainStats {
  cols: number;
  rows: number;
  totalCells: number;
  cellMeters: number;

  heightMin: number;
  heightMax: number;
  heightAvg: number;

  waterCells: number;
  vegetationCells: number;
  forestCells: number;
  bushCells: number;

  highCells: number;
  slopeCells: number;
  lowCells: number;

  invalidCells: number;
  heightOutOfRange: number;
  orphanHighCells: number;

  passed: boolean;
}
