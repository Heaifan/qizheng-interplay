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
      units: units.map((u) => ({ ...u, path: u.path.map((p) => ({ ...p })) })),
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
      ...u, path: u.path.map((p) => ({ ...p })),
    }));
    d.shots.value = frame.shots.map((s) => ({ ...s }));
    d.logs.value = frame.logs.map((l) => ({ ...l }));
    d.mode.value = frame.mode;
    d.simElapsedMs.value = frame.simElapsedMs;
    if (d.mode.value === 'executing') d.executionState.value = 'paused';
  }

  function persistBaselineFrame(): void {
    const f = takeSnapshot();
    if (d.timeline.value.length === 0) d.timeline.value.push(f);
    else d.timeline.value[0] = f;
    d.timelineIndex.value = 0;
  }

  function commitTimelineFrame(): void {
    if (d.timelineIndex.value < d.timeline.value.length - 1) {
      d.timeline.value = d.timeline.value.slice(0, d.timelineIndex.value + 1);
    }
    d.timeline.value.push(takeSnapshot());
    d.timelineIndex.value = d.timeline.value.length - 1;
    if (d.timeline.value.length > 1200) {
      d.timeline.value.shift();
      d.timelineIndex.value = Math.max(0, d.timelineIndex.value - 1);
    }
  }

  return { takeSnapshot, restoreFrame, persistBaselineFrame, commitTimelineFrame };
}
