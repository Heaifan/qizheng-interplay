// ============================================================
// renderTypes — 渲染快照类型定义
//
// TacticalRenderSnapshot 从 tacticalCanvasRenderer.ts 拆分，
// 保持 tacticalCanvasRenderer.ts ≤100 行。
// ============================================================

import type { CameraState } from '@/domain/camera';
import type { BattleTerrainMap } from '@/domain/terrainMap';
import type { BushCircle, CoverRect, RuntimeUnit, ShotTrail } from '@/domain/types';
import type { RulerState } from '@/game/ruler';
import type { ReadabilityHint } from '@/game/readability';
import type { UnitFieldData } from './drawSectors';

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
  ruler: RulerState;
  terrainMap: BattleTerrainMap | null;
  showTerrainMap: boolean;
}
