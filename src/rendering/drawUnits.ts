import type { RuntimeUnit, ShotTrail } from '@/domain/types';

export function drawShots(
  ctx: CanvasRenderingContext2D,
  shots: readonly ShotTrail[],
): void {
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i]!;
    ctx.beginPath();
    ctx.moveTo(s.x1, s.y1);
    ctx.lineTo(s.x2, s.y2);
    ctx.strokeStyle = s.color;
    ctx.globalAlpha = s.alpha;
    ctx.lineWidth = 2;
    if (s.blocked) ctx.setLineDash([10, 10]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }
}

export function drawUnits(
  ctx: CanvasRenderingContext2D,
  units: readonly RuntimeUnit[],
  highlightedUnitId: string | null = null,
): void {
  for (const u of units) {
    ctx.save();
    ctx.translate(u.x, u.y);
    if (u.dead) ctx.globalAlpha = 0.3;

    const isHighlighted = highlightedUnitId === u.id;

    if (isHighlighted) {
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 183, 77, 0.25)';
      ctx.fill();
      ctx.strokeStyle = '#ffb74d';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    if (!u.dead) {
      ctx.fillStyle = '#b71c1c';
      ctx.fillRect(-20, -35, 40, 5);
      ctx.fillStyle = '#76ff03';
      ctx.fillRect(-20, -35, 40 * (u.hp / 100), 5);
    }

    ctx.fillStyle = u.color;
    ctx.strokeStyle = u.stroke;
    ctx.lineWidth = 2;
    if (u.type === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -25);
      ctx.lineTo(25, 0);
      ctx.lineTo(0, 25);
      ctx.lineTo(-25, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.rotate(u.fireAngle);
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(12, 0);
    ctx.lineTo(6, -6);
    ctx.moveTo(12, 0);
    ctx.lineTo(6, 6);
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
}
