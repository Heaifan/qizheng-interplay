import type { CameraState } from '@/domain/camera';
import { screenToWorld } from '@/domain/camera';

const GRID_SIZE_M = 100;

export function drawViewportGrid(
  ctx: CanvasRenderingContext2D,
  camera: CameraState,
  canvasWidth: number,
  canvasHeight: number,
): void {
  const tl = screenToWorld(0, 0, camera);
  const br = screenToWorld(canvasWidth, canvasHeight, camera);

  const minX = Math.floor(Math.min(tl.x, br.x) / GRID_SIZE_M) * GRID_SIZE_M;
  const maxX = Math.ceil(Math.max(tl.x, br.x) / GRID_SIZE_M) * GRID_SIZE_M;
  const minY = Math.floor(Math.min(tl.y, br.y) / GRID_SIZE_M) * GRID_SIZE_M;
  const maxY = Math.ceil(Math.max(tl.y, br.y) / GRID_SIZE_M) * GRID_SIZE_M;

  ctx.strokeStyle = 'rgba(75, 90, 60, 0.16)';
  ctx.lineWidth = 1 / camera.zoom;
  ctx.beginPath();

  for (let x = minX; x <= maxX; x += GRID_SIZE_M) {
    ctx.moveTo(x, minY);
    ctx.lineTo(x, maxY);
  }
  for (let y = minY; y <= maxY; y += GRID_SIZE_M) {
    ctx.moveTo(minX, y);
    ctx.lineTo(maxX, y);
  }

  ctx.stroke();
}
