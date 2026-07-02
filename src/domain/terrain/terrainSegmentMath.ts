// ============================================================
// terrainSegmentMath — 线段采样数学辅助
//
// 线段长度、采样步数、插值点计算。
// ============================================================

/** 线段长度 */
export function segmentDist(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

/** 按步长计算采样步数（至少 1） */
export function sampleSteps(dist: number, stepSize: number): number {
  return Math.max(1, Math.ceil(dist / stepSize));
}

/** 线段插值点 */
export function lerpPoint(
  x1: number, y1: number,
  x2: number, y2: number,
  t: number,
): { x: number; y: number } {
  return { x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t };
}

/** 网格单元格唯一键 */
export function cellKey(col: number, row: number, stride: number): number {
  return col + row * stride;
}
