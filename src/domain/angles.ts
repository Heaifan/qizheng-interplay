/** 将任意角度归一化到 [-π, π] 区间 */
export function normalizeAngleRad(v: number): number {
  let a = v;
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

/** 计算两角度之间的最小绝对差值（弧度） */
export function angleDiffRad(a: number, b: number): number {
  return Math.abs(normalizeAngleRad(a - b));
}

/** 计算从 (ax, ay) 指向 (bx, by) 的方位角（弧度） */
export function bearingBetween(
  ax: number, ay: number, bx: number, by: number,
): number {
  return Math.atan2(by - ay, bx - ax);
}

/** 弧度转角度 */
export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}
