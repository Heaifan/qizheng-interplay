// ============================================================
// terrainShapeCheck — 图层尺寸一致性校验
//
// 检查 BattleTerrainMap 所有图层的二维数组尺寸是否与
// map.cols / map.rows 一致，保证数据结构完整性。
// ============================================================

import type { BattleTerrainMap } from '../terrainMap';

/** 图层尺寸校验结果 */
export interface ShapeCheckResult {
  /** 不一致的图层数量 */
  mismatchCount: number;
  /** 逐图层校验详情 */
  layers: Array<{
    name: string;
    expectedRows: number;
    expectedCols: number;
    actualRows: number;
    actualCols: number | null;
    ok: boolean;
  }>;
}

/**
 * 校验所有图层的二维数组尺寸。
 * 检查项：height / natural / water / vegetation / derived.high / derived.slope / derived.low
 */
export function checkLayerShapes(map: BattleTerrainMap): ShapeCheckResult {
  const { cols, rows } = map;
  const layers: ShapeCheckResult['layers'] = [];

  function check(name: string, data: number[][] | undefined | null): void {
    if (!data) {
      layers.push({
        name,
        expectedRows: rows,
        expectedCols: cols,
        actualRows: 0,
        actualCols: null,
        ok: false,
      });
      return;
    }

    const actualRows = data.length;
    let ok = actualRows === rows;

    // 检查每一行的列数
    let actualCols: number | null = null;
    if (ok) {
      for (let r = 0; r < rows; r++) {
        const rowLen = data[r]?.length ?? 0;
        if (actualCols === null) actualCols = rowLen;
        if (rowLen !== cols) {
          ok = false;
          break;
        }
      }
    }

    layers.push({
      name,
      expectedRows: rows,
      expectedCols: cols,
      actualRows,
      actualCols: ok ? cols : (actualCols ?? 0),
      ok,
    });
  }

  check('height', map.height);
  check('natural', map.natural);
  check('water', map.water);
  check('vegetation', map.vegetation);

  if (map.derived) {
    check('derived.high', map.derived.high);
    check('derived.slope', map.derived.slope);
    check('derived.low', map.derived.low);
  } else {
    // derived 不存在不算异常，标记为 skip
    ['derived.high', 'derived.slope', 'derived.low'].forEach((name) => {
      layers.push({ name, expectedRows: rows, expectedCols: cols, actualRows: 0, actualCols: null, ok: true });
    });
  }

  const mismatchCount = layers.filter((l) => !l.ok).length;

  return { mismatchCount, layers };
}
