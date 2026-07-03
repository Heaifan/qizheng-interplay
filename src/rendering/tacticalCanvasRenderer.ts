// ============================================================
// tacticalCanvasRenderer — 战术画布渲染协调
//
// 按固定顺序调用各子渲染函数，构建完整战斗画面。
// 类型定义见 renderTypes.ts。
// ============================================================

import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@/domain/constants';
import type { TacticalRenderSnapshot } from './renderTypes';
import { drawCovers, drawBushes } from './drawTerrain';
import { drawViewportGrid } from './drawViewportGrid';
import { drawBattleTerrainMap } from './drawBattleTerrainMap';
import {
  drawPerceptionField, drawFireField, drawFireFieldWeak,
  drawControlField, drawSectorCenterLines,
} from './drawSectors';
import { drawSectorLabels } from './drawSectorLabels';
import { drawReadabilityLines, drawPlannedPath } from './drawPathsShots';
import { drawRuler } from './drawRuler';
import { drawScaleBar } from './drawScaleBar';
import { drawUnitLabels } from './drawUnitLabels';
import { drawShots, drawUnits } from './drawUnits';

export type { TacticalRenderSnapshot } from './renderTypes';

export function renderTacticalScene(
  ctx: CanvasRenderingContext2D,
  snap: TacticalRenderSnapshot,
): void {
  const cam = snap.camera;
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.save();
  ctx.translate(cam.offsetX, cam.offsetY);
  ctx.scale(cam.zoom, cam.zoom);

  drawViewportGrid(ctx, cam, CANVAS_WIDTH, CANVAS_HEIGHT);
  if (snap.terrainMap && snap.showTerrainMap) {
    drawBattleTerrainMap(ctx, snap.terrainMap, true);
  }
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
      const color = i === 0 ? 'rgba(74, 126, 168, 0.75)' : 'rgba(184, 90, 77, 0.75)';
      drawPlannedPath(ctx, [{ x: u.x, y: u.y }, ...remaining], color, snap.mode === 'executing', snap.showPathArrow);
    }
  }
  drawSectorCenterLines(ctx, snap.unitFields);
  drawSectorLabels(ctx, snap.unitFields, snap.showSectorLabels, snap.highlightedUnitId);
  drawReadabilityLines(ctx, snap.readabilityHints);
  drawShots(ctx, snap.shots);
  drawUnits(ctx, snap.units, snap.highlightedUnitId, cam.zoom);

  ctx.restore();

  drawRuler(ctx, snap.ruler, cam);
  drawScaleBar(ctx, cam, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawUnitLabels(ctx, snap.units, cam);
}
