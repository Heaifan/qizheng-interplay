const NICE_SCALE_METERS = [10, 25, 50, 100, 200, 500, 1000, 2000];

/** 从预定义列表中选出最接近 rawMeters 的漂亮刻度值 */
export function chooseNiceScaleMeters(rawMeters: number): number {
  let best = NICE_SCALE_METERS[0]!;
  let bestDiff = Math.abs(rawMeters - best);
  for (const v of NICE_SCALE_METERS) {
    const d = Math.abs(rawMeters - v);
    if (d < bestDiff) { best = v; bestDiff = d; }
  }
  return best;
}

/** 根据 zoom 算出当前比例尺对应的米数（屏幕约 100px） */
export function getScaleMetersForZoom(zoom: number): number {
  const targetPixels = 100;
  return chooseNiceScaleMeters(targetPixels / zoom);
}
