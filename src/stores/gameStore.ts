import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { GameMode, LogEntry, Point, RuntimeUnit, ShotTrail } from '@/domain/types';
import { createCombatActions, missionTimeLabel } from '@/game/combat';
import { createPathEditActions } from '@/game/path-editing';
import { createTimelineActions, type TimelineFrame } from '@/game/timeline';
import { createSessionActions } from './session';
import { createExecutionActions } from './execution';
import { createPlaybackActions } from './playback';
import { createDerivedState } from './derived';

export const useGameStore = defineStore('game', () => {
  type ExecutionState = 'stopped' | 'running' | 'paused';

  const mode = ref<GameMode>('idle');
  const executionState = ref<ExecutionState>('stopped');
  const activePlannerIdx = ref<0 | 1 | null>(null);
  const units = ref<RuntimeUnit[]>([]);
  const pathUndoStacks = ref<Point[][][]>([[], []]);
  const pathRedoStacks = ref<Point[][][]>([[], []]);
  const shots = ref<ShotTrail[]>([]);
  const logs = ref<LogEntry[]>([]);
  const timeline = ref<TimelineFrame[]>([]);
  const timelineIndex = ref(0);
  const simElapsedMs = ref(0);
  const toolbarHighlight = ref<'blue' | 'red' | 'exec' | null>(null);
  const highlightedUnitId = ref<string | null>(null);
  const uiPanelTab = ref<'log' | 'editor'>('log');

  function addLog(unitId: string, text: string, tone: LogEntry['tone']): void {
    logs.value.push({
      timeLabel: missionTimeLabel(simElapsedMs.value), unitId, text, tone,
    });
  }

  const pathEdit = createPathEditActions({
    units, mode, activePlannerIdx, pathUndoStacks, pathRedoStacks, addLog,
  });
  const combat = createCombatActions({
    units, shots, logs, mode, executionState, simElapsedMs, addLog,
  });
  const tl = createTimelineActions({
    units, shots, logs, mode, simElapsedMs, executionState, timeline, timelineIndex,
  });
  const session = createSessionActions({
    mode, executionState, activePlannerIdx, units, pathUndoStacks, pathRedoStacks,
    shots, logs, timeline, timelineIndex, simElapsedMs, toolbarHighlight,
    takeSnapshot: tl.takeSnapshot, addLog,
  });
  const playbackMin = computed(() => 0);
  const playbackMax = computed(() => Math.max(0, timeline.value.length - 1));
  const exec = createExecutionActions({
    mode, executionState, units, shots, logs, simElapsedMs, toolbarHighlight,
    tryFire: combat.tryFire,
    persistBaselineFrame: tl.persistBaselineFrame,
    commitTimelineFrame: tl.commitTimelineFrame,
    addLog,
  });
  const playback = createPlaybackActions({
    mode, executionState, units, shots, logs, simElapsedMs,
    timeline, timelineIndex, toolbarHighlight,
    playbackMin, playbackMax,
    restoreFrame: tl.restoreFrame,
    runSimulationTick: exec.runSimulationTick,
    commitTimelineFrame: tl.commitTimelineFrame,
  });
  const derived = createDerivedState({ units, shots, mode, highlightedUnitId, uiPanelTab });

  const canStepBack = computed(() => timelineIndex.value > 0);
  const canStepForward = computed(() =>
    timelineIndex.value < timeline.value.length - 1 || mode.value === 'executing',
  );
  const canUndoPathEdit = computed(() => {
    if (activePlannerIdx.value === null) return false;
    return pathUndoStacks.value[activePlannerIdx.value]!.length > 0;
  });
  const canRedoPathEdit = computed(() => {
    if (activePlannerIdx.value === null) return false;
    return pathRedoStacks.value[activePlannerIdx.value]!.length > 0;
  });

  session.initGame();

  return {
    mode, executionState, units, shots, logs, toolbarHighlight,
    highlightedUnitId, uiPanelTab,
    renderSnapshot: derived.renderSnapshot,
    canStepBack, canStepForward, canUndoPathEdit, canRedoPathEdit,
    playbackMin, playbackMax, timelineIndex,
    initGame: session.initGame,
    selectPlannerByPoint: session.selectPlannerByPoint,
    beginPathAt: pathEdit.beginPathAt,
    extendPathIfFarEnough: pathEdit.extendPathIfFarEnough,
    finalizePathDrawing: pathEdit.finalizePathDrawing,
    undoPathEdit: pathEdit.undoPathEdit,
    redoPathEdit: pathEdit.redoPathEdit,
    startExecution: exec.startExecution,
    pauseExecution: exec.pauseExecution,
    resumeExecution: exec.resumeExecution,
    stepBackward: playback.stepBackward,
    stepForward: playback.stepForward,
    seekTimeline: playback.seekTimeline,
    resetSandbox: session.initGame,
    tick: exec.tick,
  };
});
