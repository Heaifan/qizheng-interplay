export interface UnitFieldData {
  unitId: string;
  x: number;
  y: number;
  angle: number;
  perceptionRange: number;
  perceptionHalfAngle: number;
  fireRange: number;
  fireHalfAngle: number;
  controlRange: number;
  controlHalfAngle: number;
  strokeColor: string;
}

const BLUE_FILL = 'rgba(74, 126, 168,';
const RED_FILL = 'rgba(184, 90, 77,';

function isBlue(strokeColor: string): boolean {
  return strokeColor === '#4A7EA8';
}

export function drawPerceptionField(
  ctx: CanvasRenderingContext2D,
  fields: ReadonlyArray<UnitFieldData>,
): void {
  for (const f of fields) {
    const base = isBlue(f.strokeColor) ? BLUE_FILL : RED_FILL;
    const s = f.angle - f.perceptionHalfAngle;
    const e = f.angle + f.perceptionHalfAngle;
    ctx.beginPath();
    ctx.moveTo(f.x, f.y);
    ctx.arc(f.x, f.y, f.perceptionRange, s, e);
    ctx.closePath();
    ctx.fillStyle = `${base} 0.06)`;
    ctx.fill();
  }
}

export function drawFireField(
  ctx: CanvasRenderingContext2D,
  fields: ReadonlyArray<UnitFieldData>,
): void {
  for (const f of fields) {
    const base = isBlue(f.strokeColor) ? BLUE_FILL : RED_FILL;
    const s = f.angle - f.fireHalfAngle;
    const eF = f.angle + f.fireHalfAngle;
    ctx.beginPath();
    ctx.moveTo(f.x, f.y);
    ctx.arc(f.x, f.y, f.fireRange, s, eF);
    ctx.closePath();
    ctx.fillStyle = `${base} 0.14)`;
    ctx.fill();
  }
}

export function drawFireFieldWeak(
  ctx: CanvasRenderingContext2D,
  fields: ReadonlyArray<UnitFieldData>,
): void {
  for (const f of fields) {
    const base = isBlue(f.strokeColor) ? BLUE_FILL : RED_FILL;
    const s = f.angle - f.fireHalfAngle;
    const eF = f.angle + f.fireHalfAngle;
    ctx.beginPath();
    ctx.moveTo(f.x, f.y);
    ctx.arc(f.x, f.y, f.fireRange, s, eF);
    ctx.closePath();
    ctx.fillStyle = `${base} 0.07)`;
    ctx.fill();
  }
}

export function drawControlField(
  ctx: CanvasRenderingContext2D,
  fields: ReadonlyArray<UnitFieldData>,
): void {
  for (const f of fields) {
    const base = isBlue(f.strokeColor) ? BLUE_FILL : RED_FILL;
    const s = f.angle - f.controlHalfAngle;
    const eC = f.angle + f.controlHalfAngle;
    ctx.beginPath();
    ctx.moveTo(f.x, f.y);
    ctx.arc(f.x, f.y, f.controlRange, s, eC);
    ctx.closePath();
    ctx.fillStyle = `${base} 0.07)`;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(f.x, f.y);
    ctx.arc(f.x, f.y, f.controlRange, s, eC);
    ctx.closePath();
    ctx.strokeStyle = `${base} 0.38)`;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}
