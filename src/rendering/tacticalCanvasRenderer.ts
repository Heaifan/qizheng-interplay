import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@/domain/constants';
import type { BushCircle, CoverRect, RuntimeUnit, ShotTrail } from '@/domain/types';
import type { ReadabilityHint } from '@/game/readability';
import { drawGridAndScale, drawCovers, drawBushes } from './drawTerrain';
import { drawThreatZones, type ThreatZone } from './drawSectors';
import { drawReadabilityLines, drawPlannedPath } from './drawPathsShots';
import { drawShots, drawUnits } from './drawUnits';

export interface TacticalRenderSnapshot {
  covers: readonly CoverRect[];
  bushes: readonly BushCircle[];
  units: readonly RuntimeUnit[];
  shots: readonly ShotTrail[];
  threatZones: ReadonlyArray<ThreatZone>;
  readabilityHints: ReadonlyArray<ReadabilityHint>;
  mode: string;
  showPlannedPath: boolean;
  showPathArrow: boolean;
  highlightedUnitId: string | null;
}

export function renderTacticalScene(
  ctx: CanvasRenderingContext2D,
  snap: TacticalRenderSnapshot,
): void {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawGridAndScale(ctx);
  drawThreatZones(ctx, snap.threatZones);
  drawReadabilityLines(ctx, snap.readabilityHints);
  drawCovers(ctx, snap.covers);
  drawBushes(ctx, snap.bushes);

  if (snap.showPlannedPath) {
    for (let i = 0; i < snap.units.length; i++) {
      const u = snap.units[i]!;
      const remaining = u.path.slice(Math.max(0, u.currentPathIdx));
      if (remaining.length < 1) continue;
      const color = i === 0
        ? 'rgba(3, 169, 244, 0.8)'
        : 'rgba(244, 67, 54, 0.8)';
      drawPlannedPath(
        ctx,
        [{ x: u.x, y: u.y }, ...remaining],
        color,
        snap.mode === 'executing',
        snap.showPathArrow,
      );
    }
  }

  drawShots(ctx, snap.shots);
  drawUnits(ctx, snap.units, snap.highlightedUnitId);
}
