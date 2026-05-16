import type { RuntimeUnit, ShotTrail } from '@/domain/types';
import { getWeaponById } from '@/domain/weaponCatalog';
import { drawUnitGlyph, resolveUnitGlyphKind } from './unitGlyphs';

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

    // weapon glyph (rotated with facing direction)
    ctx.rotate(u.angle);
    const glyphKind = resolveUnitGlyphKind(u);
    drawUnitGlyph(ctx, glyphKind, 0.9 / z);

    ctx.restore();

    // tactical labels (world space, separate from unit transform)
    drawUnitTacticalLabels(ctx, u, zoom);
  }
}

/** 兵牌信息标签：编制标记(Ø)、装备型号、速度、单位名称 */
export function drawUnitTacticalLabels(
  ctx: CanvasRenderingContext2D,
  u: RuntimeUnit,
  zoom: number,
): void {
  const z = Math.max(zoom, 0.01);
  const r = BASE.iconRadius / z;
  const topY = u.y - r;
  const bottomY = u.y + r;
  const leftX = u.x - r;
  const rightX = u.x + r;

  const weapon = getWeaponById(u.weaponId);
  const weaponName = weapon?.displayName ?? weapon?.name ?? '?';
  const speedText = `${Math.round(u.currentSpeedKmh)}km/h`;
  const formText = 'Ø';

  ctx.save();
  ctx.font = `500 ${11 / z}px sans-serif`;
  ctx.lineWidth = Math.max(2.5 / z, 0.5);
  ctx.strokeStyle = 'rgba(255, 250, 230, 0.85)';
  ctx.fillStyle = '#2f2a1f';

  // —— formation mark (Ø) at top center ——
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  const formY = topY - 6 / z;
  ctx.strokeText(formText, u.x, formY);
  ctx.fillText(formText, u.x, formY);

  // —— speed at right side, top-aligned ——
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const speedX = rightX + 5 / z;
  const speedY = topY + 4 / z;
  ctx.strokeText(speedText, speedX, speedY);
  ctx.fillText(speedText, speedX, speedY);

  // —— weapon name at left-bottom outer, flush to marker edge ——
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const weapX = leftX - 4 / z;
  const weapY = bottomY - 2 / z;
  ctx.strokeText(weaponName, weapX, weapY);
  ctx.fillText(weaponName, weapX, weapY);

  ctx.restore();
}
