import type { Ref } from 'vue';
import type { GameMode, LogEntry, Point, RuntimeUnit, ShotTrail } from '@/domain/types';
import { createRuntimeUnitsFromTemplates, UNIT_TEMPLATES } from '@/domain/units';
import type { TimelineFrame } from '@/game/timeline';

export interface SessionDeps {
  mode: Ref<GameMode>;
  executionState: Ref<'stopped' | 'running' | 'paused'>;
  activePlannerIdx: Ref<0 | 1 | null>;
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
    d.addLog('系统', '右键单位后开始绘制路径。', 'log-system');
    d.timeline.value.push(d.takeSnapshot());
  }

  function selectPlannerByPoint(pos: Point): boolean {
    if (d.mode.value === 'gameover') return false;
    if (d.mode.value === 'executing' && d.executionState.value === 'running') return false;
    const nearest = d.units.value
      .map((u, idx) => ({ idx, d: Math.hypot(u.x - pos.x, u.y - pos.y), id: u.id }))
      .sort((a, b) => a.d - b.d)[0];
    if (!nearest || nearest.d > 30) return false;
    d.activePlannerIdx.value = nearest.idx as 0 | 1;
    if (d.mode.value !== 'executing') {
      d.mode.value = nearest.idx === 0 ? 'planBlue' : 'planRed';
    }
    d.toolbarHighlight.value = nearest.idx === 0 ? 'blue' : 'red';
    d.addLog('系统', `已选择${nearest.id}，可开始绘制路径。`, 'log-system');
    return true;
  }

  return { initGame, selectPlannerByPoint };
}
