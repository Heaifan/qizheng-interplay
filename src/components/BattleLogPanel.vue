<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useTemplateRef, watch, nextTick } from 'vue';
import { useGameStore } from '@/stores/gameStore';

const game = useGameStore();
const { logs } = storeToRefs(game);
const scrollRoot = useTemplateRef('scrollRoot');

watch(
  () => logs.value.length,
  async () => {
    await nextTick();
    const el = scrollRoot.value;
    if (el) el.scrollTop = el.scrollHeight;
  },
);

function sideClass(unitId: string): string {
  if (unitId === '蓝方') return 'log-blue';
  if (unitId === '红方') return 'log-red';
  return '';
}
</script>

<template>
  <aside class="log-panel">
    <div class="log-header">战斗日志</div>
    <div ref="scrollRoot" class="log-content">
      <div v-for="(entry, i) in logs" :key="i" class="log-entry">
        <span style="color: #81c784">[{{ entry.timeLabel }}]</span>
        <strong :class="sideClass(entry.unitId)">{{ entry.unitId }}</strong
        >:
        <span :class="entry.tone">{{ entry.text }}</span>
      </div>
    </div>
  </aside>
</template>
