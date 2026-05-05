import type { BushCircle, CoverRect } from './types';

/** 纯几何计算 — 无游戏语义 */

export function lineLineIntersect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  x4: number,
  y4: number,
): boolean {
  const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (den === 0) return false;
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

export function lineRectIntersect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
): boolean {
  const left = lineLineIntersect(x1, y1, x2, y2, rx, ry, rx, ry + rh);
  const right = lineLineIntersect(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh);
  const top = lineLineIntersect(x1, y1, x2, y2, rx, ry, rx + rw, ry);
  const bottom = lineLineIntersect(x1, y1, x2, y2, rx, ry + rh, rx + rw, ry + rh);
  return left || right || top || bottom;
}

export function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const l2 = (x1 - x2) ** 2 + (y1 - y2) ** 2;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

export function segmentBlockedByAnyCover(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  covers: readonly CoverRect[],
): boolean {
  for (const c of covers) {
    if (lineRectIntersect(x1, y1, x2, y2, c.x, c.y, c.w, c.h)) return true;
  }
  return false;
}

export function segmentNearAnyBush(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  bushes: readonly BushCircle[],
): boolean {
  for (const b of bushes) {
    if (distToSegment(b.x, b.y, x1, y1, x2, y2) < b.r) return true;
  }
  return false;
}
