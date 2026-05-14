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
  const barH = 22;
  const label = scaleMeters >= 1000
    ? `${scaleMeters / 1000}km / 格`
    : `${scaleMeters}m / 格`;
  const labelWidth = ctx.measureText(label).width;
  const totalW = Math.max(pixels + padX * 2, labelWidth + 20);
  const barX = padX;
  const barY = ch - padY - barH;

  // background
  ctx.fillStyle = 'rgba(242, 236, 217, 0.85)';
  ctx.strokeStyle = 'rgba(184, 138, 46, 0.40)';
  ctx.lineWidth = 1;
  roundRect(ctx, barX - 4, barY - 2, totalW, barH + 4, 4);
  ctx.fill();
  ctx.stroke();

  // bar line
  ctx.strokeStyle = '#2F2A22';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(barX, barY + barH / 2);
  ctx.lineTo(barX + pixels, barY + barH / 2);
  ctx.stroke();

  // end ticks
  ctx.beginPath();
  ctx.moveTo(barX, barY + 4);
  ctx.lineTo(barX, barY + barH - 4);
  ctx.moveTo(barX + pixels, barY + 4);
  ctx.lineTo(barX + pixels, barY + barH - 4);
  ctx.stroke();

  // label
  ctx.fillStyle = '#2F2A22';
  ctx.font = '12px Microsoft YaHei, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, barX + pixels / 2, barY + barH / 2);
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
