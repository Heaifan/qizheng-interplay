import type { CameraState } from '@/domain/camera';
import { getScaleMetersForZoom } from '@/domain/mapScale';

export function drawScaleBar(
  ctx: CanvasRenderingContext2D,
  cam: CameraState,
  cw: number,
  ch: number,
): void {
  const scaleMeters = getScaleMetersForZoom(cam.zoom);
  const pixels = scaleMeters * cam.zoom;
  const padX = 12;
  const padY = 10;
  const label = scaleMeters >= 1000
    ? `${scaleMeters / 1000}km / 格`
    : `${scaleMeters}m / 格`;

  ctx.font = '12px Microsoft YaHei, sans-serif';
  const textW = ctx.measureText(label).width;
  const barW = Math.max(pixels, textW + 16);
  const boxH = 40;
  const boxW = barW + padX * 2;
  const bx = padX;
  const by = ch - padY - boxH;

  // background
  ctx.fillStyle = 'rgba(242, 236, 217, 0.85)';
  ctx.strokeStyle = 'rgba(184, 138, 46, 0.40)';
  ctx.lineWidth = 1;
  roundRect(ctx, bx - 4, by - 2, boxW + 4, boxH + 4, 4);
  ctx.fill();
  ctx.stroke();

  // label (first line)
  ctx.fillStyle = '#2F2A22';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(label, bx + barW / 2, by + 18);

  // bar line (second line)
  ctx.strokeStyle = '#2F2A22';
  ctx.lineWidth = 2;
  ctx.beginPath();
  const barY = by + 28;
  ctx.moveTo(bx, barY);
  ctx.lineTo(bx + pixels, barY);
  ctx.stroke();

  // end ticks
  ctx.beginPath();
  ctx.moveTo(bx, barY - 4);
  ctx.lineTo(bx, barY + 4);
  ctx.moveTo(bx + pixels, barY - 4);
  ctx.lineTo(bx + pixels, barY + 4);
  ctx.stroke();
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
