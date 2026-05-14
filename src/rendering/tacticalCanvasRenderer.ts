import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@/domain/constants';
import type { CameraState } from '@/domain/camera';
import type { BushCircle, CoverRect, RuntimeUnit, ShotTrail } from '@/domain/types';
import type { ReadabilityHint } from '@/game/readability';
import { drawCovers, drawBushes } from './drawTerrain';
import { drawViewportGrid } from './drawViewportGrid';
import {
  drawPerceptionField,
  drawFireField,
  drawFireFieldWeak,
  drawControlField,
  drawSectorCenterLines,
  type UnitFieldData,
} from './drawSectors';
import { drawSectorLabels } from './drawSectorLabels';
import { drawReadabilityLines, drawPlannedPath } from './drawPathsShots';
import { drawScaleBar } from './drawScaleBar';
import { drawUnitLabels } from './drawUnitLabels';
import { drawShots, drawUnits } from './drawUnits';

export interface TacticalRenderSnapshot {
  covers: readonly CoverRect[];
  bushes: readonly BushCircle[];
  units: readonly RuntimeUnit[];
  shots: readonly ShotTrail[];
  unitFields: ReadonlyArray<UnitFieldData>;
  readabilityHints: ReadonlyArray<ReadabilityHint>;
  mode: string;
  showPlannedPath: boolean;
  showPathArrow: boolean;
  highlightedUnitId: string | null;
  showSectorLabels: boolean;
  camera: CameraState;
}

export function renderTacticalScene(
  ctx: CanvasRenderingContext2D,
  snap: TacticalRenderSnapshot,
): void {
  const cam = snap.camera;

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // battlefield: all drawing is in world coordinates, apply camera
  ctx.save();
  ctx.translate(cam.offsetX, cam.offsetY);
  ctx.scale(cam.zoom, cam.zoom);

  drawViewportGrid(ctx, cam, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawCovers(ctx, snap.covers);
  drawBushes(ctx, snap.bushes);
  const hlId = snap.highlightedUnitId;
  const hlFields = hlId ? snap.unitFields.filter((f) => f.unitId === hlId) : [];
  const otherFields = hlId ? snap.unitFields.filter((f) => f.unitId !== hlId) : snap.unitFields;

  if (hlId) {
    drawPerceptionField(ctx, hlFields);
    drawFireField(ctx, hlFields);
    drawControlField(ctx, hlFields);
    drawFireFieldWeak(ctx, otherFields);
  } else {
    drawFireFieldWeak(ctx, otherFields);
  }

  if (snap.showPlannedPath) {
    for (let i = 0; i < snap.units.length; i++) {
      const u = snap.units[i]!;
      const remaining = u.path.slice(Math.max(0, u.currentPathIdx));
      if (remaining.length < 1) continue;
      const color = i === 0
        ? 'rgba(74, 126, 168, 0.75)'
        : 'rgba(184, 90, 77, 0.75)';
      drawPlannedPath(
        ctx,
        [{ x: u.x, y: u.y }, ...remaining],
        color,
        snap.mode === 'executing',
        snap.showPathArrow,
      );
    }
  }

  drawSectorCenterLines(ctx, snap.unitFields);
  drawSectorLabels(ctx, snap.unitFields, snap.showSectorLabels, snap.highlightedUnitId);
  drawReadabilityLines(ctx, snap.readabilityHints);
  drawShots(ctx, snap.shots);
  drawUnits(ctx, snap.units, snap.highlightedUnitId);

  ctx.restore();

  // overlay — not affected by camera
  drawScaleBar(ctx, cam, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawUnitLabels(ctx, snap.units, cam);
}
