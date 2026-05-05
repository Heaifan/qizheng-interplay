import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@/domain/constants';
import type { BushCircle, CoverRect, RuntimeUnit, ShotTrail } from '@/domain/types';

/** Canvas 绘制 — 只读快照，不修改游戏状态 */

export interface TacticalRenderSnapshot {
  covers: readonly CoverRect[];
  bushes: readonly BushCircle[];
  units: readonly RuntimeUnit[];
  shots: readonly ShotTrail[];
  mode: string;
  showPlannedPath: boolean;
  showPathArrow: boolean;
}

let debugRenderCount = 0;
let debugArrowLogCount = 0;

function resolveArrowVector(points: Array<{ x: number; y: number }>, desiredLen: number): { fromX: number; fromY: number; toX: number; toY: number } | null {
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
      return {
        fromX: b.x - ux * remain,
        fromY: b.y - uy * remain,
        toX: to.x,
        toY: to.y,
      };
    }

    remain -= segLen;
  }

  const first = points[0]!;
  return { fromX: first.x, fromY: first.y, toX: to.x, toY: to.y };
}

function drawPathArrow(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number): void {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const len = Math.hypot(dx, dy);
  // #region agent log
  if (debugArrowLogCount < 8) {
    debugArrowLogCount++;
    fetch('http://127.0.0.1:7525/ingest/a523c2c6-b217-4642-94e6-5b99fe0996b8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dc1890'},body:JSON.stringify({sessionId:'dc1890',runId:'repro13',hypothesisId:'H1',location:'src/rendering/tacticalCanvasRenderer.ts:drawPathArrow',message:'path arrow draw metrics',data:{fromX,fromY,toX,toY,len,modeHint:'plan_or_execute_shared'},timestamp:Date.now()})}).catch(()=>{});
  }
  // #endregion
  if (len < 8) return;

  const ux = dx / len;
  const uy = dy / len;
  const tipX = toX;
  const tipY = toY;
  const arrowLen = 16;
  const wing = 8;

  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(tipX - ux * arrowLen - uy * wing, tipY - uy * arrowLen + ux * wing);
  ctx.lineTo(tipX - ux * arrowLen + uy * wing, tipY - uy * arrowLen - ux * wing);
  ctx.closePath();
  ctx.fill();
}

export function renderTacticalScene(ctx: CanvasRenderingContext2D, snap: TacticalRenderSnapshot): void {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = '#616161';
  ctx.strokeStyle = '#424242';
  ctx.lineWidth = 2;
  for (const c of snap.covers) {
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeRect(c.x, c.y, c.w, c.h);
  }

  ctx.fillStyle = 'rgba(124, 179, 66, 0.6)';
  for (const b of snap.bushes) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.arc(b.x + 10, b.y - 10, b.r * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  if (snap.showPlannedPath) {
    snap.units.forEach((u, i) => {
      const remaining = u.path.slice(Math.max(0, u.currentPathIdx));
      if (remaining.length < 1) return;
      const pathPoints = [{ x: u.x, y: u.y }, ...remaining];
      if (pathPoints.length < 2) return;

      const color = i === 0 ? 'rgba(3, 169, 244, 0.8)' : 'rgba(244, 67, 54, 0.8)';
      ctx.beginPath();
      ctx.moveTo(pathPoints[0]!.x, pathPoints[0]!.y);
      for (const p of pathPoints.slice(1)) {
        ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.setLineDash(snap.mode === 'executing' ? [] : [6, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
      if (snap.showPathArrow) {
        ctx.fillStyle = color;
        const arrowVec = resolveArrowVector(pathPoints, 28);
        if (arrowVec) {
          drawPathArrow(ctx, arrowVec.fromX, arrowVec.fromY, arrowVec.toX, arrowVec.toY);
        }
        if (debugRenderCount < 8) {
          debugRenderCount++;
          // #region agent log
          fetch('http://127.0.0.1:7525/ingest/a523c2c6-b217-4642-94e6-5b99fe0996b8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dc1890'},body:JSON.stringify({sessionId:'dc1890',runId:'repro14',hypothesisId:'H2',location:'src/rendering/tacticalCanvasRenderer.ts:renderTacticalScene',message:'rendered arrow with backtracked anchor',data:{unitId:u.id,pathLen:u.path.length,currentPathIdx:u.currentPathIdx,pathPoints:pathPoints.length,mode:snap.mode,showPathArrow:snap.showPathArrow,arrowVec},timestamp:Date.now()})}).catch(()=>{});
          // #endregion
        }
      }
    });
  }

  for (let i = snap.shots.length - 1; i >= 0; i--) {
    const s = snap.shots[i]!;
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

  for (const u of snap.units) {
    ctx.save();
    ctx.translate(u.x, u.y);
    if (u.dead) ctx.globalAlpha = 0.3;

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

    ctx.rotate(u.angle);
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
