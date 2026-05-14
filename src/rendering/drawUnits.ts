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

const BASE = {
  iconRadius: 18,
  diamondH: 22,
  diamondW: 22,
  hlRadius: 24,
  hlLineWidth: 2.5,
  barW: 36,
  barH: 4,
  barY: -32,
  arrowLen: 14,
  arrowWing: 6,
  arrowOff: -5,
  arrowLineW: 2.5,
  shapeLineW: 2,
};

export function drawUnits(
  ctx: CanvasRenderingContext2D,
  units: readonly RuntimeUnit[],
  highlightedUnitId: string | null = null,
  zoom = 1,
): void {
  const z = Math.max(zoom, 0.01);

  for (const u of units) {
    ctx.save();
    ctx.translate(u.x, u.y);
    if (u.dead) ctx.globalAlpha = 0.3;

    const isHighlighted = highlightedUnitId === u.id;

    // highlight ring
    if (isHighlighted) {
      const r = BASE.hlRadius / z;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(184, 138, 46, 0.22)';
      ctx.fill();
      ctx.strokeStyle = '#B88A2E';
      ctx.lineWidth = BASE.hlLineWidth / z;
      ctx.globalAlpha = 0.9;
      ctx.stroke();
      ctx.globalAlpha = u.dead ? 0.3 : 1;
    }

    // HP bar
    if (!u.dead) {
      const bw = BASE.barW / z;
      const bh = BASE.barH / z;
      const by = BASE.barY / z;
      ctx.fillStyle = '#8D6E63';
      ctx.fillRect(-bw / 2, by, bw, bh);
      ctx.fillStyle = '#81C784';
      ctx.fillRect(-bw / 2, by, bw * (u.hp / 100), bh);
    }

    // unit shape
    ctx.fillStyle = u.color;
    ctx.strokeStyle = u.stroke;
    ctx.lineWidth = BASE.shapeLineW / z;
    if (u.type === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, BASE.iconRadius / z, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      const h = BASE.diamondH / z;
      const w = BASE.diamondW / z;
      ctx.beginPath();
      ctx.moveTo(0, -h);
      ctx.lineTo(w, 0);
      ctx.lineTo(0, h);
      ctx.lineTo(-w, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // facing arrow
    ctx.rotate(u.angle);
    const al = BASE.arrowLen / z;
    const aw = BASE.arrowWing / z;
    const ao = BASE.arrowOff / z;
    ctx.beginPath();
    ctx.moveTo(ao, 0);
    ctx.lineTo(ao + al, 0);
    ctx.lineTo(ao + al - aw, -aw);
    ctx.moveTo(ao + al, 0);
    ctx.lineTo(ao + al - aw, aw);
    ctx.strokeStyle = '#2F2A22';
    ctx.lineWidth = BASE.arrowLineW / z;
    ctx.stroke();

    ctx.restore();
  }
}
