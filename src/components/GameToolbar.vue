<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useGameStore } from '@/stores/gameStore';

const game = useGameStore();
const {
  toolbarHighlight, mode, executionState,
  canStepBack, canStepForward,
  canUndoPathEdit, canRedoPathEdit,
  playbackMin, playbackMax, timelineIndex,
  uiPanelTab,
} = storeToRefs(game);

function onPlay() {
  if (mode.value !== 'executing') {
    uiPanelTab.value = 'log';
    game.startExecution();
  } else {
    game.resumeExecution();
  }
}

function onPause() {
  game.pauseExecution();
}

function onScrub(ev: Event) {
  const input = ev.target as HTMLInputElement;
  game.seekTimeline(Number(input.value));
}
</script>

<template>
  <div class="tactical-controls player-bar">
    <button type="button" class="btn-player btn-play"
      :class="{ active: toolbarHighlight === 'exec' && executionState === 'running' }"
      title="播放/继续" @click="onPlay">▶</button>
    <button type="button" class="btn-player btn-pause"
      title="暂停" :disabled="mode !== 'executing'" @click="onPause">⏸</button>
    <button type="button" class="btn-player btn-edit" title="撤销路径编辑"
      :disabled="!canUndoPathEdit" @click="game.undoPathEdit()">
      <svg class="toolbar-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"
          d="M3 10h10a5 5 0 0 1 5 5v0a5 5 0 0 1-5 5H9" />
        <polyline fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"
          points="7,6 3,10 7,14" />
      </svg>
    </button>
    <button type="button" class="btn-player btn-edit" title="重做路径编辑"
      :disabled="!canRedoPathEdit" @click="game.redoPathEdit()">
      <svg class="toolbar-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"
          d="M21 10H11a5 5 0 0 0-5 5v0a5 5 0 0 0 5 5h4" />
        <polyline fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"
          points="17,6 21,10 17,14" />
      </svg>
    </button>
    <button type="button" class="btn-player btn-step" title="上一步"
      :disabled="!canStepBack" @click="game.stepBackward()">⏮</button>
    <input class="player-slider" type="range"
      :min="playbackMin" :max="playbackMax" :value="timelineIndex"
      :disabled="playbackMax === 0" @input="onScrub" />
    <button type="button" class="btn-player btn-step" title="下一步"
      :disabled="!canStepForward" @click="game.stepForward()">⏭</button>
    <button type="button" class="btn-player btn-reset"
      title="重置沙盘" @click="game.resetSandbox()">↺</button>
  </div>
</template>
