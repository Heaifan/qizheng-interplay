<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useGameStore } from '@/stores/gameStore';
import type { InteractionMode } from '@/domain/types';

const game = useGameStore();
const { interactionMode } = storeToRefs(game);

const modes: { key: InteractionMode; label: string }[] = [
  { key: 'browse', label: '浏览' },
  { key: 'measure', label: '测距' },
  { key: 'planPath', label: '规划' },
];
</script>

<template>
  <div
    class="map-toolbar"
    @pointerdown.stop
    @pointerup.stop
    @mousedown.stop
    @mouseup.stop
    @click.stop
    @dblclick.stop
    @contextmenu.stop.prevent
  >
    <button
      v-for="m in modes"
      :key="m.key"
      type="button"
      :class="['tool-btn', { active: interactionMode === m.key }]"
      @pointerdown.stop
      @mousedown.stop
      @click.stop="game.interactionMode = m.key"
    >
      {{ m.label }}
    </button>
  </div>
</template>

<style scoped>
.map-toolbar {
  display: flex;
  gap: 2px;
  background: rgba(242, 236, 217, 0.90);
  border: 1px solid rgba(184, 138, 46, 0.30);
  border-radius: 6px;
  padding: 3px;
  box-shadow: 0 2px 6px rgba(72, 60, 36, 0.12);
}

.tool-btn {
  border: none;
  background: transparent;
  color: #8A8477;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.tool-btn.active {
  background: rgba(184, 138, 46, 0.15);
  color: #2F2A22;
}

.tool-btn:hover:not(.active) {
  color: #5C554A;
}
</style>
