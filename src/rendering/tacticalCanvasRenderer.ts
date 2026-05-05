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

function drawPathArrow(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number): void {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const len = Math.hypot(dx, dy);
  if (len < 16) return;

  const ux = dx / len;
  const uy = dy / len;
  const tipX = toX - ux * 6;
  const tipY = toY - uy * 6;
  const wing = 5;

  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(tipX - ux * 10 - uy * wing, tipY - uy * 10 + ux * wing);
  ctx.lineTo(tipX - ux * 10 + uy * wing, tipY - uy * 10 - ux * wing);
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
        const a = pathPoints[pathPoints.length - 2]!;
        const b = pathPoints[pathPoints.length - 1]!;
        drawPathArrow(ctx, a.x, a.y, b.x, b.y);
        if (debugRenderCount < 8) {
          debugRenderCount++;
          // #region agent log
          fetch('http://127.0.0.1:7525/ingest/a523c2c6-b217-4642-94e6-5b99fe0996b8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dc1890'},body:JSON.stringify({sessionId:'dc1890',runId:'repro7',hypothesisId:'H3',location:'src/rendering/tacticalCanvasRenderer.ts:renderTacticalScene',message:'rendered remaining path+single arrow',data:{unitId:u.id,pathLen:u.path.length,currentPathIdx:u.currentPathIdx,pathPoints:pathPoints.length,mode:snap.mode,showPathArrow:snap.showPathArrow},timestamp:Date.now()})}).catch(()=>{});
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
