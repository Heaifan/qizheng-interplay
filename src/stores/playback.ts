import type { ComputedRef, Ref } from 'vue';
import type { GameMode, LogEntry, RuntimeUnit, ShotTrail } from '@/domain/types';
import type { TimelineFrame } from '@/game/timeline';

export interface PlaybackDeps {
  mode: Ref<GameMode>;
  executionState: Ref<'stopped' | 'running' | 'paused'>;
  units: Ref<RuntimeUnit[]>;
  shots: Ref<ShotTrail[]>;
  logs: Ref<LogEntry[]>;
  simElapsedMs: Ref<number>;
  timeline: Ref<TimelineFrame[]>;
  timelineIndex: Ref<number>;
  toolbarHighlight: Ref<'blue' | 'red' | 'exec' | null>;
  playbackMin: ComputedRef<number>;
  playbackMax: ComputedRef<number>;
  restoreFrame: (frame: TimelineFrame) => void;
  runSimulationTick: () => void;
  commitTimelineFrame: () => void;
}

export function createPlaybackActions(d: PlaybackDeps) {
  /** 统一跳帧：所有时间轴跳转统一走此函数 */
  function seekToFrame(index: number): void {
    const target = Math.max(
      d.playbackMin.value,
      Math.min(index, d.timeline.value.length - 1),
    );
    if (!d.timeline.value[target]) return;
    d.timelineIndex.value = target;
    d.restoreFrame(d.timeline.value[target]!);
    d.executionState.value = 'paused';
    d.toolbarHighlight.value = 'exec';
  }

  function stepBackward(): void {
    if (d.timelineIndex.value <= d.playbackMin.value) return;
    seekToFrame(d.timelineIndex.value - 1);
  }

  function stepForward(): void {
    if (d.timelineIndex.value < d.timeline.value.length - 1) {
      seekToFrame(d.timelineIndex.value + 1);
      return;
    }
    if (d.mode.value !== 'executing') return;
    d.runSimulationTick();
    d.commitTimelineFrame();
    d.executionState.value = 'paused';
    d.toolbarHighlight.value = 'exec';
  }

  function seekTimeline(index: number): void {
    seekToFrame(index);
  }

  function rewindToStart(): void {
    seekToFrame(d.playbackMin.value);
  }

  return { stepBackward, stepForward, seekTimeline, rewindToStart, seekToFrame };
}
