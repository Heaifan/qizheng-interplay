import type { CameraState } from '@/domain/camera';
import { worldToScreen } from '@/domain/camera';
import type { RuntimeUnit } from '@/domain/types';

/** 在 overlay 层绘制固定大小的单位名称标签（不受 camera 缩放影响） */
export function drawUnitLabels(
  ctx: CanvasRenderingContext2D,
  units: readonly RuntimeUnit[],
  camera: CameraState,
): void {
  ctx.font = '11px Microsoft YaHei, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const u of units) {
    if (u.dead) continue;
    const sp = worldToScreen(u.x, u.y, camera);
    const label = u.combatProfile.name || u.id;
    const tw = ctx.measureText(label).width;
    const px = 6;
    const py = 3;
    const bw = tw + px * 2;
    const bh = 18;
    const lx = sp.x;
    const ly = sp.y + 34;

    // background
    ctx.fillStyle = 'rgba(242, 236, 217, 0.80)';
    ctx.beginPath();
    roundRect(ctx, lx - bw / 2, ly - bh / 2, bw, bh, 3);
    ctx.fill();

    // text
    ctx.fillStyle = '#5C554A';
    ctx.fillText(label, lx, ly + 1);
  }
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
