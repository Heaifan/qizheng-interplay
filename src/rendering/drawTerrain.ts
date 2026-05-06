import { CANVAS_HEIGHT, CANVAS_WIDTH, GRID_CELL_METERS, GRID_CELL_PX } from '@/domain/constants';
import type { BushCircle, CoverRect } from '@/domain/types';

export function drawGridAndScale(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = 'rgba(76, 104, 61, 0.24)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= CANVAS_WIDTH; x += GRID_CELL_PX) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, CANVAS_HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_CELL_PX) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(CANVAS_WIDTH, y + 0.5);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(38, 50, 56, 0.7)';
  ctx.font = '12px Microsoft YaHei, sans-serif';
  ctx.fillText(`比例尺：1格 = ${GRID_CELL_METERS}米`, 12, 18);
}

export function drawCovers(ctx: CanvasRenderingContext2D, covers: readonly CoverRect[]): void {
  ctx.fillStyle = '#616161';
  ctx.strokeStyle = '#424242';
  ctx.lineWidth = 2;
  for (const c of covers) {
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeRect(c.x, c.y, c.w, c.h);
  }
}

export function drawBushes(ctx: CanvasRenderingContext2D, bushes: readonly BushCircle[]): void {
  ctx.fillStyle = 'rgba(124, 179, 66, 0.6)';
  for (const b of bushes) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.arc(b.x + 10, b.y - 10, b.r * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
}
