import type { Ref } from 'vue';
import type { GameMode, LogEntry, Point, RuntimeUnit, ShotTrail } from '@/domain/types';
import { createRuntimeUnitsFromTemplates, UNIT_TEMPLATES } from '@/domain/units';
import type { TimelineFrame } from '@/game/timeline';

export interface SessionDeps {
  mode: Ref<GameMode>;
  executionState: Ref<'stopped' | 'running' | 'paused'>;
  activePlannerIdx: Ref<0 | 1 | null>;
  highlightedUnitId: Ref<string | null>;
  uiPanelTab: Ref<'log' | 'editor'>;
  units: Ref<RuntimeUnit[]>;
  pathUndoStacks: Ref<Point[][][]>;
  pathRedoStacks: Ref<Point[][][]>;
  shots: Ref<ShotTrail[]>;
  logs: Ref<LogEntry[]>;
  timeline: Ref<TimelineFrame[]>;
  timelineIndex: Ref<number>;
  simElapsedMs: Ref<number>;
  toolbarHighlight: Ref<'blue' | 'red' | 'exec' | null>;
  takeSnapshot: () => TimelineFrame;
  addLog: (unitId: string, text: string, tone: LogEntry['tone']) => void;
}

export function createSessionActions(d: SessionDeps) {
  function initGame(): void {
    d.units.value = createRuntimeUnitsFromTemplates(UNIT_TEMPLATES);
    d.pathUndoStacks.value = [[], []];
    d.pathRedoStacks.value = [[], []];
    d.shots.value = [];
    d.logs.value = [];
    d.mode.value = 'idle';
    d.executionState.value = 'stopped';
    d.activePlannerIdx.value = null;
    d.simElapsedMs.value = 0;
    d.timeline.value = [];
    d.timelineIndex.value = 0;
    d.toolbarHighlight.value = null;
    d.highlightedUnitId.value = null;
    d.addLog('系统', '右键单位后开始绘制路径。', 'log-system');
    d.timeline.value.push(d.takeSnapshot());
  }

  function findNearestUnit(pos: Point, threshold = 30) {
    const nearest = d.units.value
      .map((u, idx) => ({ unit: u, idx, distance: Math.hypot(u.x - pos.x, u.y - pos.y) }))
      .sort((a, b) => a.distance - b.distance)[0];
    if (!nearest || nearest.distance > threshold) return null;
    return nearest;
  }

  /** 纯查看选择：只更新高亮和右侧档案，不改 activePlannerIdx / mode */
  function selectUnitForInspectByPoint(pos: Point): boolean {
    const nearest = findNearestUnit(pos, 30);
    if (!nearest) return false;
    d.highlightedUnitId.value = nearest.unit.id;
    d.uiPanelTab.value = 'editor';
    d.toolbarHighlight.value = nearest.idx === 0 ? 'blue' : 'red';
    return true;
  }

  /** 路径规划选择：由右键/规划工具调用，设置 activePlannerIdx 并切换 mode */
  function selectPlannerByPoint(pos: Point): boolean {
    if (d.mode.value === 'gameover') return false;
    const nearest = findNearestUnit(pos, 30);
    if (!nearest) return false;
    d.activePlannerIdx.value = nearest.idx as 0 | 1;
    d.highlightedUnitId.value = nearest.unit.id;
    d.toolbarHighlight.value = nearest.idx === 0 ? 'blue' : 'red';
    if (d.mode.value === 'executing') return true;
    d.mode.value = nearest.idx === 0 ? 'planBlue' : 'planRed';
    d.addLog('系统', `已选择${nearest.unit.id}，可开始绘制路径。`, 'log-system');
    return true;
  }

  return { initGame, selectUnitForInspectByPoint, selectPlannerByPoint };
}
