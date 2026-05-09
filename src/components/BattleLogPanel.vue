<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useTemplateRef, watch, nextTick } from 'vue';
import { useGameStore } from '@/stores/gameStore';
import UnitEditor from './UnitEditor.vue';

const game = useGameStore();
const { logs, uiPanelTab, highlightedUnitId } = storeToRefs(game);
const scrollRoot = useTemplateRef('scrollRoot');

watch(
  () => logs.value.length,
  async () => {
    await nextTick();
    const el = scrollRoot.value;
    if (el) el.scrollTop = el.scrollHeight;
  },
);

watch(uiPanelTab, (tab) => {
  if (tab !== 'editor') highlightedUnitId.value = null;
});

function selectTab(tab: 'log' | 'editor'): void {
  uiPanelTab.value = tab;
}

function sideClass(unitId: string): string {
  if (unitId === '蓝方') return 'log-blue';
  if (unitId === '红方') return 'log-red';
  return '';
}
</script>

<template>
  <aside class="log-panel">
    <div class="tab-bar">
      <button
        :class="['tab-btn', { active: uiPanelTab === 'log' }]"
        @click="selectTab('log')"
      >
        战斗日志
      </button>
      <button
        :class="['tab-btn', { active: uiPanelTab === 'editor' }]"
        @click="selectTab('editor')"
      >
        单位编辑
      </button>
    </div>
    <div v-show="uiPanelTab === 'log'" ref="scrollRoot" class="log-content">
      <div v-for="(entry, i) in logs" :key="i" class="log-entry">
        <span style="color: #81c784">[{{ entry.timeLabel }}]</span>
        <strong :class="sideClass(entry.unitId)">{{ entry.unitId }}</strong
        >:
        <span :class="entry.tone">{{ entry.text }}</span>
      </div>
    </div>
    <UnitEditor v-show="uiPanelTab === 'editor'" />
  </aside>
</template>

<style scoped>
.tab-bar {
  display: flex;
  border-radius: 5px 5px 0 0;
  overflow: hidden;
  flex-shrink: 0;
}

.tab-btn {
  flex: 1;
  padding: 8px 0;
  border: none;
  background: #37474f;
  color: #78909c;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.tab-btn.active {
  background: #263238;
  color: #ffb74d;
}

.tab-btn:hover:not(.active) {
  color: #b0bec5;
}
</style>
