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

  /** 查看单位选择：只更新高亮和右侧档案，不进入规划模式 */
  function selectUnitByPoint(pos: Point): boolean {
    const nearest = d.units.value
      .map((u, idx) => ({ idx, d: Math.hypot(u.x - pos.x, u.y - pos.y), id: u.id }))
      .sort((a, b) => a.d - b.d)[0];
    if (!nearest || nearest.d > 30) return false;
    d.activePlannerIdx.value = nearest.idx as 0 | 1;
    d.highlightedUnitId.value = nearest.id;
    d.toolbarHighlight.value = nearest.idx === 0 ? 'blue' : 'red';
    d.uiPanelTab.value = 'editor';
    return true;
  }

  /** 路径规划选择：负责进入规划模式，可调用 selectUnitByPoint */
  function selectPlannerByPoint(pos: Point): boolean {
    if (d.mode.value === 'gameover') return false;
    selectUnitByPoint(pos);
    if (d.activePlannerIdx.value === null) return false;
    if (d.mode.value === 'executing') return true; // 执行中可查看但不进入规划
    d.mode.value = d.activePlannerIdx.value === 0 ? 'planBlue' : 'planRed';
    d.addLog('系统', `已选择${d.units.value[d.activePlannerIdx.value]!.id}，可开始绘制路径。`, 'log-system');
    return true;
  }

  return { initGame, selectUnitByPoint, selectPlannerByPoint };
}
