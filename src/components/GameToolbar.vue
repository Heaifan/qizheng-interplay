<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useGameStore } from '@/stores/gameStore';
import { onMounted, useTemplateRef } from 'vue';

const game = useGameStore();
const { toolbarHighlight, mode, executionState, canStepBack, canStepForward, canUndoPathEdit, canRedoPathEdit, playbackMin, playbackMax, timelineIndex } = storeToRefs(game);
const toolbarRef = useTemplateRef('toolbar');
const sliderRef = useTemplateRef('slider');

function onPlay() {
  if (mode.value !== 'executing') game.startExecution();
  else game.resumeExecution();
}

function onPause() {
  game.pauseExecution();
}

function onScrub(ev: Event) {
  const input = ev.target as HTMLInputElement;
  game.seekTimeline(Number(input.value));
}

onMounted(() => {
  const toolbar = toolbarRef.value;
  const slider = sliderRef.value;
  // #region agent log
  fetch('http://127.0.0.1:7525/ingest/a523c2c6-b217-4642-94e6-5b99fe0996b8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dc1890'},body:JSON.stringify({sessionId:'dc1890',runId:'repro17',hypothesisId:'H2',location:'src/components/GameToolbar.vue:onMounted',message:'player bar width snapshot',data:{toolbarRect:toolbar?.getBoundingClientRect(),sliderRect:slider?.getBoundingClientRect(),playbackMin:playbackMin.value,playbackMax:playbackMax.value},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
});
</script>

<template>
  <div ref="toolbar" class="tactical-controls player-bar">
    <button
      type="button"
      class="btn-player btn-play"
      :class="{ active: toolbarHighlight === 'exec' && executionState === 'running' }"
      title="播放/继续"
      @click="onPlay"
    >
      ▶
    </button>
    <button
      type="button"
      class="btn-player btn-pause"
      title="暂停"
      :disabled="mode !== 'executing'"
      @click="onPause"
    >
      ⏸
    </button>
    <button type="button" class="btn-player btn-edit" title="撤销路径编辑" :disabled="!canUndoPathEdit" @click="game.undoPathEdit()">
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 5a7 7 0 0 1 6.88 5.71 1 1 0 1 1-1.97.34A5 5 0 0 0 12 7H8.41l1.3 1.29a1 1 0 1 1-1.42 1.42l-3-3a1 1 0 0 1 0-1.42l3-3a1 1 0 1 1 1.42 1.42L8.41 5H12z"
        />
      </svg>
    </button>
    <button type="button" class="btn-player btn-edit" title="重做路径编辑" :disabled="!canRedoPathEdit" @click="game.redoPathEdit()">
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 5a7 7 0 0 0-6.88 5.71 1 1 0 1 0 1.97.34A5 5 0 0 1 12 7h3.59l-1.3 1.29a1 1 0 1 0 1.42 1.42l3-3a1 1 0 0 0 0-1.42l-3-3a1 1 0 1 0-1.42 1.42L15.59 5H12z"
        />
      </svg>
    </button>
    <button type="button" class="btn-player btn-step" title="上一步" :disabled="!canStepBack" @click="game.stepBackward()">⏮</button>
    <input
      ref="slider"
      class="player-slider"
      type="range"
      :min="playbackMin"
      :max="playbackMax"
      :value="timelineIndex"
      :disabled="playbackMax === 0"
      @input="onScrub"
    />
    <button type="button" class="btn-player btn-step" title="下一步" :disabled="!canStepForward" @click="game.stepForward()">⏭</button>
    <button
      type="button"
      class="btn-player btn-reset"
      title="重置沙盘"
      @click="game.resetSandbox()"
    >
      ↺
    </button>
  </div>
</template>
