<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useGameStore } from '@/stores/gameStore';

const game = useGameStore();
const { toolbarHighlight } = storeToRefs(game);
</script>

<template>
  <div class="tactical-controls">
    <button
      type="button"
      class="btn-exec"
      :class="{ active: toolbarHighlight === 'exec' }"
      @click="game.startExecution()"
    >
      ⚔️ 开始执行
    </button>
    <button type="button" class="btn-reset" @click="game.resetSandbox()">↺ 重置沙盘</button>
  </div>
</template>
