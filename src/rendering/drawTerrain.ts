import type { BushCircle, CoverRect } from '@/domain/types';

export function drawCovers(ctx: CanvasRenderingContext2D, covers: readonly CoverRect[]): void {
  ctx.fillStyle = '#6D675E';
  ctx.globalAlpha = 0.85;
  ctx.strokeStyle = '#4A453D';
  ctx.lineWidth = 2;
  for (const c of covers) {
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeRect(c.x, c.y, c.w, c.h);
  }
  ctx.globalAlpha = 1;
}

export function drawBushes(ctx: CanvasRenderingContext2D, bushes: readonly BushCircle[]): void {
  ctx.fillStyle = 'rgba(151, 168, 116, 0.55)';
  for (const b of bushes) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.arc(b.x + 10, b.y - 10, b.r * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
}
