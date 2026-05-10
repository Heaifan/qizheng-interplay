import type { ReadabilityHint } from '@/game/readability';

export function drawReadabilityLines(
  ctx: CanvasRenderingContext2D,
  hints: ReadonlyArray<ReadabilityHint>,
): void {
  for (const hint of hints) {
    ctx.beginPath();
    ctx.moveTo(hint.attackerX, hint.attackerY);
    ctx.lineTo(hint.targetX, hint.targetY);
    if (hint.inFireArc) {
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = hint.color;
      ctx.lineWidth = 1.5;
    } else if (hint.inPerception) {
      ctx.globalAlpha = 0.14;
      ctx.strokeStyle = '#90a4ae';
      ctx.lineWidth = 1;
    } else {
      ctx.globalAlpha = 0.08;
      ctx.strokeStyle = '#b0a89a';
      ctx.lineWidth = 0.8;
    }
    if (hint.blocked) ctx.setLineDash([8, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }
}

export function drawPlannedPath(
  ctx: CanvasRenderingContext2D,
  pathPoints: Array<{ x: number; y: number }>,
  color: string,
  isExecuting: boolean,
  showArrow: boolean,
): void {
  if (pathPoints.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(pathPoints[0]!.x, pathPoints[0]!.y);
  for (const p of pathPoints.slice(1)) ctx.lineTo(p.x, p.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.setLineDash(isExecuting ? [] : [6, 6]);
  ctx.stroke();
  ctx.setLineDash([]);
  if (showArrow) {
    ctx.fillStyle = color;
    const vec = resolveArrowVector(pathPoints, 28);
    if (vec) drawArrowHead(ctx, vec.fromX, vec.fromY, vec.toX, vec.toY);
  }
}

function resolveArrowVector(
  points: Array<{ x: number; y: number }>,
  desiredLen: number,
): { fromX: number; fromY: number; toX: number; toY: number } | null {
  if (points.length < 2) return null;
  const to = points[points.length - 1]!;
  let remain = desiredLen;
  for (let i = points.length - 2; i >= 0; i--) {
    const a = points[i]!;
    const b = points[i + 1]!;
    const segDx = b.x - a.x;
    const segDy = b.y - a.y;
    const segLen = Math.hypot(segDx, segDy);
    if (segLen < 0.001) continue;
    if (segLen >= remain) {
      const ux = segDx / segLen;
      const uy = segDy / segLen;
      return { fromX: b.x - ux * remain, fromY: b.y - uy * remain, toX: to.x, toY: to.y };
    }
    remain -= segLen;
  }
  const first = points[0]!;
  return { fromX: first.x, fromY: first.y, toX: to.x, toY: to.y };
}

function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  fromX: number, fromY: number,
  toX: number, toY: number,
): void {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const len = Math.hypot(dx, dy);
  if (len < 8) return;
  const ux = dx / len;
  const uy = dy / len;
  const arrowLen = 16;
  const wing = 8;
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - ux * arrowLen - uy * wing, toY - uy * arrowLen + ux * wing);
  ctx.lineTo(toX - ux * arrowLen + uy * wing, toY - uy * arrowLen - ux * wing);
  ctx.closePath();
  ctx.fill();
}
