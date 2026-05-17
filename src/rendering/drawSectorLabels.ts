import type { UnitFieldData } from './drawSectors';

const LABELS = [
  { id: 'perception', text: '感知场', rangeRatio: 0.65 },
  { id: 'fire', text: '火力扇区', rangeRatio: 0.50 },
  { id: 'control', text: '控制场', rangeRatio: 0.35 },
] as const;

export function drawSectorLabels(
  ctx: CanvasRenderingContext2D,
  unitFields: ReadonlyArray<UnitFieldData>,
  show: boolean,
  selectedUnitId: string | null,
): void {
  if (!show || !selectedUnitId) return;

  const field = unitFields.find((f) => f.unitId === selectedUnitId);
  if (!field) return;

  ctx.save();
  ctx.font = '11px Microsoft YaHei, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const label of LABELS) {
    const range = label.id === 'perception'
      ? field.perceptionRange
      : label.id === 'fire'
        ? field.fireRange
        : field.controlRange;

    const dist = range * label.rangeRatio;
    const lx = field.x + Math.cos(field.angle) * dist;
    const ly = field.y + Math.sin(field.angle) * dist;

    const textWidth = ctx.measureText(label.text).width;
    const padX = 8;
    const padY = 4;
    const bw = textWidth + padX * 2;
    const bh = 20;

    ctx.fillStyle = 'rgba(242, 236, 217, 0.92)';
    ctx.strokeStyle = 'rgba(184, 138, 46, 0.45)';
    ctx.lineWidth = 1;
    roundRect(ctx, lx - bw / 2, ly - bh / 2, bw, bh, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#2F2A22';
    ctx.fillText(label.text, lx, ly + 1);
  }

  ctx.restore();
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
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + h - r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
