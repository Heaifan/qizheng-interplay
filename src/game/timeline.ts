import type { Ref } from 'vue';
import type { GameMode, LogEntry, RuntimeUnit, ShotTrail } from '@/domain/types';

export interface TimelineFrame {
  units: RuntimeUnit[];
  shots: ShotTrail[];
  logs: LogEntry[];
  mode: GameMode;
  simElapsedMs: number;
}

export interface TimelineDeps {
  units: Ref<RuntimeUnit[]>;
  shots: Ref<ShotTrail[]>;
  logs: Ref<LogEntry[]>;
  mode: Ref<GameMode>;
  simElapsedMs: Ref<number>;
  executionState: Ref<'stopped' | 'running' | 'paused'>;
  timeline: Ref<TimelineFrame[]>;
  timelineIndex: Ref<number>;
}

export function createTimelineActions(d: TimelineDeps) {
  function cloneFrame(
    units: RuntimeUnit[],
    shots: ShotTrail[],
    logs: LogEntry[],
    mode: GameMode,
    simElapsedMs: number,
  ): TimelineFrame {
    return {
      units: units.map((u) => ({
        ...u,
        path: u.path.map((p) => ({ ...p })),
        combatProfile: JSON.parse(JSON.stringify(u.combatProfile)),
      })),
      shots: shots.map((s) => ({ ...s })),
      logs: logs.map((l) => ({ ...l })),
      mode,
      simElapsedMs,
    };
  }

  function takeSnapshot(): TimelineFrame {
    return cloneFrame(
      d.units.value, d.shots.value, d.logs.value,
      d.mode.value, d.simElapsedMs.value,
    );
  }

  function restoreFrame(frame: TimelineFrame): void {
    d.units.value = frame.units.map((u) => ({
      ...u,
      path: u.path.map((p) => ({ ...p })),
      combatProfile: JSON.parse(JSON.stringify(u.combatProfile)),
    }));
    d.shots.value = frame.shots.map((s) => ({ ...s }));
    d.logs.value = frame.logs.map((l) => ({ ...l }));
    d.mode.value = frame.mode;
    d.simElapsedMs.value = frame.simElapsedMs;
    if (d.mode.value === 'executing') d.executionState.value = 'paused';
  }

  function persistBaselineFrame(): void {
    const f = takeSnapshot();
    // If timeline is empty, push frame[0] (initial state) and frame[1] (pre-exec baseline)
    if (d.timeline.value.length === 0) {
      d.timeline.value.push(takeSnapshot());
      d.timeline.value.push(f);
      d.timelineIndex.value = 1;
    } else if (d.timeline.value.length === 1) {
      // frame[0] exists (initial state), push baseline as frame[1]
      d.timeline.value.push(f);
      d.timelineIndex.value = 1;
    } else {
      // Replace baseline at index 1, keep frame[0] as true initial state
      d.timeline.value[1] = f;
      d.timeline.value = d.timeline.value.slice(0, 2);
      d.timelineIndex.value = 1;
    }
  }

  function commitTimelineFrame(): void {
    if (d.timelineIndex.value < d.timeline.value.length - 1) {
      d.timeline.value = d.timeline.value.slice(0, d.timelineIndex.value + 1);
    }
    d.timeline.value.push(takeSnapshot());
    d.timelineIndex.value = d.timeline.value.length - 1;
    const MAX_FRAMES = 1200;
    const PRESERVED_HEAD = 2; // keep frame[0] (initial) and frame[1] (exec baseline)
    if (d.timeline.value.length > MAX_FRAMES) {
      d.timeline.value.splice(PRESERVED_HEAD, 1);
      d.timelineIndex.value = Math.max(PRESERVED_HEAD, d.timelineIndex.value - 1);
    }
  }

  return { takeSnapshot, restoreFrame, persistBaselineFrame, commitTimelineFrame };
}
