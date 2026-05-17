import type { CameraState } from '@/domain/camera';
import { screenToWorld } from '@/domain/camera';
import { getScaleMetersForZoom } from '@/domain/mapScale';

export function drawViewportGrid(
  ctx: CanvasRenderingContext2D,
  camera: CameraState,
  canvasWidth: number,
  canvasHeight: number,
): void {
  const gridSizeMeters = getScaleMetersForZoom(camera.zoom);

  const tl = screenToWorld(0, 0, camera);
  const br = screenToWorld(canvasWidth, canvasHeight, camera);

  const minX = Math.floor(Math.min(tl.x, br.x) / gridSizeMeters) * gridSizeMeters;
  const maxX = Math.ceil(Math.max(tl.x, br.x) / gridSizeMeters) * gridSizeMeters;
  const minY = Math.floor(Math.min(tl.y, br.y) / gridSizeMeters) * gridSizeMeters;
  const maxY = Math.ceil(Math.max(tl.y, br.y) / gridSizeMeters) * gridSizeMeters;

  ctx.strokeStyle = 'rgba(75, 90, 60, 0.16)';
  ctx.lineWidth = 1 / camera.zoom;
  ctx.beginPath();

  for (let x = minX; x <= maxX; x += gridSizeMeters) {
    ctx.moveTo(x, minY);
    ctx.lineTo(x, maxY);
  }
  for (let y = minY; y <= maxY; y += gridSizeMeters) {
    ctx.moveTo(minX, y);
    ctx.lineTo(maxX, y);
  }

  ctx.stroke();
}
