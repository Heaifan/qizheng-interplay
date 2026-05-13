import type { Ref } from 'vue';
import { SHOT_ALPHA_DECAY } from '@/domain/constants';
import type { GameMode, LogEntry, RuntimeUnit, ShotTrail } from '@/domain/types';
import { advanceUnitAlongPath } from '@/game/movement';
import { updateTacticalFacing } from '@/game/facing';

const SIM_STEP_MS = 1000 / 60;

export interface ExecutionDeps {
  mode: Ref<GameMode>;
  executionState: Ref<'stopped' | 'running' | 'paused'>;
  units: Ref<RuntimeUnit[]>;
  shots: Ref<ShotTrail[]>;
  logs: Ref<LogEntry[]>;
  simElapsedMs: Ref<number>;
  toolbarHighlight: Ref<'blue' | 'red' | 'exec' | null>;
  tryFire: (attacker: RuntimeUnit, target: RuntimeUnit, now: number) => void;
  persistBaselineFrame: () => void;
  commitTimelineFrame: () => void;
  addLog: (unitId: string, text: string, tone: LogEntry['tone']) => void;
}

export function createExecutionActions(d: ExecutionDeps) {
  let debugTickCount = 0;

  function runSimulationTick(): void {
    debugTickCount++;
    d.simElapsedMs.value += SIM_STEP_MS;
    for (let i = d.shots.value.length - 1; i >= 0; i--) {
      const s = d.shots.value[i]!;
      s.alpha -= SHOT_ALPHA_DECAY;
      if (s.alpha <= 0) d.shots.value.splice(i, 1);
    }
    for (const u of d.units.value) advanceUnitAlongPath(u);
    updateTacticalFacing(d.units.value);
    const now = Date.now();
    const [blue, red] = d.units.value;
    if (blue && red && !blue.dead && !red.dead) {
      d.tryFire(blue, red, now);
      d.tryFire(red, blue, now);
    }
  }

  function tick(_timestamp?: number): void {
    if (d.mode.value !== 'executing' || d.executionState.value !== 'running') return;
    runSimulationTick();
    d.commitTimelineFrame();
  }

  function startExecution(): void {
    if (d.mode.value === 'gameover') return;
    d.persistBaselineFrame();
    d.mode.value = 'executing';
    d.executionState.value = 'running';
    d.toolbarHighlight.value = 'exec';
    d.addLog('系统', '命令已下达，单位开始沿路径移动。', 'log-system');
  }

  function pauseExecution(): void {
    if (d.mode.value !== 'executing') return;
    d.executionState.value = 'paused';
    d.addLog('系统', '推演已暂停。', 'log-system');
  }

  function resumeExecution(): void {
    if (d.mode.value !== 'executing') return;
    d.executionState.value = 'running';
    d.addLog('系统', '推演已恢复。', 'log-system');
  }

  return { runSimulationTick, tick, startExecution, pauseExecution, resumeExecution };
}
