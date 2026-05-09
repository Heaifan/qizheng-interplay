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
    <!-- 播放 -->
    <button type="button" class="btn-player btn-play"
      :class="{ active: toolbarHighlight === 'exec' && executionState === 'running' }"
      title="播放 / 继续" @click="onPlay">
      <svg class="toolbar-icon icon-lg" viewBox="0 0 24 24" fill="none">
        <path d="M8 6L18 12L8 18V6Z" fill="currentColor"/>
      </svg>
    </button>

    <!-- 暂停 -->
    <button type="button" class="btn-player btn-pause"
      title="暂停" :disabled="mode !== 'executing'" @click="onPause">
      <svg class="toolbar-icon icon-lg" viewBox="0 0 24 24" fill="none">
        <rect x="7" y="6" width="4" height="12" rx="1" fill="currentColor"/>
        <rect x="13" y="6" width="4" height="12" rx="1" fill="currentColor"/>
      </svg>
    </button>

    <!-- 撤销 -->
    <button type="button" class="btn-player btn-edit" title="撤销路径编辑"
      :disabled="!canUndoPathEdit" @click="game.undoPathEdit()">
      <svg class="toolbar-icon icon-md" viewBox="0 0 24 24" fill="none">
        <path d="M9 8L5 12L9 16" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6 12H13C16.314 12 19 14.686 19 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <!-- 重做 -->
    <button type="button" class="btn-player btn-edit" title="重做路径编辑"
      :disabled="!canRedoPathEdit" @click="game.redoPathEdit()">
      <svg class="toolbar-icon icon-md" viewBox="0 0 24 24" fill="none">
        <path d="M15 8L19 12L15 16" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M18 12H11C7.686 12 5 14.686 5 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <!-- 单步后退 -->
    <button type="button" class="btn-player btn-step" title="上一步"
      :disabled="!canStepBack" @click="game.stepBackward()">
      <svg class="toolbar-icon icon-lg" viewBox="0 0 24 24" fill="none">
        <rect x="5" y="6" width="2.5" height="12" rx="1" fill="currentColor"/>
        <path d="M18 6L9.5 12L18 18V6Z" fill="currentColor"/>
      </svg>
    </button>

    <!-- 时间轴 -->
    <input class="player-slider" type="range"
      :min="playbackMin" :max="playbackMax" :value="timelineIndex"
      :disabled="playbackMax === 0" @input="onScrub" />

    <!-- 单步前进 -->
    <button type="button" class="btn-player btn-step" title="下一步"
      :disabled="!canStepForward" @click="game.stepForward()">
      <svg class="toolbar-icon icon-lg" viewBox="0 0 24 24" fill="none">
        <rect x="16.5" y="6" width="2.5" height="12" rx="1" fill="currentColor"/>
        <path d="M6 6L14.5 12L6 18V6Z" fill="currentColor"/>
      </svg>
    </button>

    <!-- 重置 -->
    <button type="button" class="btn-player btn-reset"
      title="重置沙盘" @click="game.resetSandbox()">
      <svg class="toolbar-icon icon-md" viewBox="0 0 24 24" fill="none">
        <path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"
          d="M5 8C6.564 5.313 9.355 3.5 12.5 3.5C17.194 3.5 21 7.306 21 12C21 16.694 17.194 20.5 12.5 20.5C8.816 20.5 5.652 18.021 4 14.554" />
        <polyline fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"
          points="7,4 3,8 7,12" />
      </svg>
    </button>
  </div>
</template>
