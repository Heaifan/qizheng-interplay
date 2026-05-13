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
    ctx.globalAlpha = Math.max(s.alpha, 0.35);
    ctx.lineWidth = 2.5;
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
      ctx.fillStyle = 'rgba(184, 138, 46, 0.22)';
      ctx.fill();
      ctx.strokeStyle = '#B88A2E';
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.9;
      ctx.stroke();
      ctx.globalAlpha = u.dead ? 0.3 : 1;
    }

    if (!u.dead) {
      ctx.fillStyle = '#8D6E63';
      ctx.fillRect(-20, -35, 40, 5);
      ctx.fillStyle = '#81C784';
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

    ctx.rotate(u.angle);
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(14, 0);
    ctx.lineTo(7, -7);
    ctx.moveTo(14, 0);
    ctx.lineTo(7, 7);
    ctx.strokeStyle = '#2F2A22';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  }
}
