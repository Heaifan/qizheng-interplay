// ============================================================
// drawBattleTerrainMap — BattleTerrainMap 渲染主函数
// 渲染层级：高度底色 → 派生层覆盖 → 水体 → 植被 → 弱网格
// ============================================================

import type { BattleTerrainMap } from '@/domain/terrainMap';
import { WaterTerrain, DerivedTerrain } from '@/domain/terrainMap';
import {
  heightTint, WATER_COLORS, VEGETATION_COLORS,
  DERIVED_COLORS, GRID_COLOR_MAIN, GRID_COLOR_FINE,
} from './terrainRenderColors';

export function drawBattleTerrainMap(
  ctx: CanvasRenderingContext2D,
  map: BattleTerrainMap,
  showGrid: boolean,
): void {
  const cs = map.cellMeters;
  for (let row = 0; row < map.rows; row++) {
    for (let col = 0; col < map.cols; col++) {
      const x = col * cs, y = row * cs;
      const h = map.height[row][col];

      ctx.fillStyle = heightTint(h);
      ctx.fillRect(x, y, cs, cs);
    }
  }

  // derived overlay
  if (map.derived) {
    const derived = map.derived;
    ctx.save();
    for (let row = 0; row < map.rows; row++) {
      for (let col = 0; col < map.cols; col++) {
        const x = col * cs, y = row * cs;
        if (derived.high?.[row]?.[col]) {
          ctx.fillStyle = DERIVED_COLORS[DerivedTerrain.high];
          ctx.fillRect(x, y, cs, cs);
        } else if (derived.slope?.[row]?.[col]) {
          ctx.fillStyle = DERIVED_COLORS[DerivedTerrain.slope];
          ctx.fillRect(x, y, cs, cs);
        } else if (derived.low?.[row]?.[col]) {
          ctx.fillStyle = DERIVED_COLORS[DerivedTerrain.low];
          ctx.fillRect(x, y, cs, cs);
        }
      }
    }
    ctx.restore();
  }

  // water
  for (let row = 0; row < map.rows; row++) {
    for (let col = 0; col < map.cols; col++) {
      const w = map.water[row][col];
      if (!w) continue;
      ctx.fillStyle = WATER_COLORS[w] || WATER_COLORS[WaterTerrain.river];
      ctx.fillRect(col * cs, row * cs, cs, cs);
    }
  }

  // vegetation
  for (let row = 0; row < map.rows; row++) {
    for (let col = 0; col < map.cols; col++) {
      const v = map.vegetation[row][col];
      if (!v) continue;
      ctx.fillStyle = VEGETATION_COLORS[v];
      ctx.fillRect(col * cs, row * cs, cs, cs);
    }
  }

  // grid
  if (!showGrid || cs < 4) return;
  ctx.save();
  ctx.strokeStyle = GRID_COLOR_FINE;
  ctx.lineWidth = 0.5;
  for (let x = 1; x < map.cols; x++) {
    const px = x * cs;
    ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, map.rows * cs); ctx.stroke();
  }
  for (let y = 1; y < map.rows; y++) {
    const py = y * cs;
    ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(map.cols * cs, py); ctx.stroke();
  }
  ctx.strokeStyle = GRID_COLOR_MAIN;
  ctx.lineWidth = 0.8;
  for (let x = 0; x <= map.cols; x += 4) {
    const px = x * cs;
    ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, map.rows * cs); ctx.stroke();
  }
  for (let y = 0; y <= map.rows; y += 4) {
    const py = y * cs;
    ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(map.cols * cs, py); ctx.stroke();
  }
  ctx.restore();
}
