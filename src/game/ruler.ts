export interface RulerPoint {
  x: number;
  y: number;
}

export interface RulerState {
  active: boolean;
  visible: boolean;
  start: RulerPoint | null;
  end: RulerPoint | null;
}

export function getDistanceMeters(a: RulerPoint, b: RulerPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function getBearingDeg(a: RulerPoint, b: RulerPoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
}

export function formatDistance(d: number): string {
  return d < 1000 ? `${Math.round(d)}m` : `${(d / 1000).toFixed(2)}km`;
}

export function formatBearing(deg: number): string {
  return `${Math.round(deg).toString().padStart(3, '0')}°`;
}
