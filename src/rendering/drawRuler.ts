import type { CameraState } from '@/domain/camera';
import { worldToScreen } from '@/domain/camera';
import type { RulerState } from '@/game/ruler';
import { getDistanceMeters, getBearingDeg, formatDistance, formatBearing } from '@/game/ruler';

export function drawRuler(
  ctx: CanvasRenderingContext2D,
  ruler: RulerState,
  camera: CameraState,
): void {
  if (!ruler.visible || !ruler.start || !ruler.end) return;

  const a = worldToScreen(ruler.start.x, ruler.start.y, camera);
  const b = worldToScreen(ruler.end.x, ruler.end.y, camera);
  const dist = getDistanceMeters(ruler.start, ruler.end);
  const bear = getBearingDeg(ruler.start, ruler.end);
  const label = `${formatDistance(dist)}｜${formatBearing(bear)}`;

  // line
  ctx.strokeStyle = 'rgba(72, 58, 32, 0.85)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.setLineDash([]);

  // end points
  ctx.fillStyle = 'rgba(72, 58, 32, 0.85)';
  for (const p of [a, b]) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // label background
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2 - 12;
  ctx.font = '12px Microsoft YaHei, sans-serif';
  const tw = ctx.measureText(label).width;
  const px = 6;
  const py = 3;
  ctx.fillStyle = 'rgba(246, 239, 215, 0.88)';
  ctx.strokeStyle = 'rgba(80, 65, 40, 0.35)';
  ctx.lineWidth = 1;
  roundRect(ctx, mx - tw / 2 - px, my - 9 - py, tw + px * 2, 18 + py * 2, 3);
  ctx.fill();
  ctx.stroke();

  // label text
  ctx.fillStyle = '#2F2A22';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, mx, my + 1);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y - h + r, r);
  ctx.closePath();
}
