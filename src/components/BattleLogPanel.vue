<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useTemplateRef, watch, nextTick } from 'vue';
import { useGameStore } from '@/stores/gameStore';
import UnitEditor from './UnitEditor.vue';
import CasualtyChart from './CasualtyChart.vue';

const game = useGameStore();
const { logs, visibleLogs, uiPanelTab, highlightedUnitId, casualtySeries, simElapsedMs } = storeToRefs(game);
const scrollRoot = useTemplateRef('scrollRoot');

watch(
  () => visibleLogs.value.length,
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

function eventTag(tone: string): string {
  const map: Record<string, string> = {
    'log-hit': '[命中]',
    'log-miss': '[射击]',
    'log-kill': '[结束]',
    'log-system': '[系统]',
    '': '[命令]',
  };
  return map[tone] ?? '';
}

function entryRowClass(tone: string): string {
  if (tone === 'log-hit') return 'log-entry log-entry--hit';
  if (tone === 'log-kill') return 'log-entry log-entry--kill';
  return 'log-entry';
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
        单位档案
      </button>
    </div>
    <div v-show="uiPanelTab === 'log'" ref="scrollRoot" class="log-content" style="flex:1;overflow-y:auto">
      <div v-for="(entry, i) in visibleLogs" :key="i" :class="entryRowClass(entry.tone)">
        <span class="log-time">[{{ entry.timeLabel }}]</span><span class="log-tag">{{ eventTag(entry.tone) }}</span>
        <strong v-if="entry.unitId !== '系统'" :class="sideClass(entry.unitId)">{{ entry.unitId }}</strong>
        <span :class="entry.tone">{{ entry.text }}</span>
      </div>
    </div>
    <UnitEditor v-show="uiPanelTab === 'editor'" />
    <CasualtyChart
      :series="casualtySeries"
      :current-time-sec="Math.floor(simElapsedMs / 1000)"
    />
  </aside>
</template>

<style scoped>
.log-time {
  color: #B88A2E;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.log-tag {
  color: #8A8477;
  font-size: 12px;
  margin-right: 2px;
}

.log-entry--hit {
  background: rgba(185, 111, 44, 0.08);
  border-radius: 3px;
  padding-left: 4px;
}

.log-entry--kill {
  background: rgba(169, 68, 56, 0.10);
  border-radius: 3px;
  padding-left: 4px;
}
</style>

<style scoped>
.tab-bar {
  display: flex;
  flex-shrink: 0;
  border-bottom: 1px solid var(--panel-divider);
}

.tab-btn {
  flex: 1;
  padding: 10px 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text-dim);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}

.tab-btn.active {
  color: var(--text-main);
  font-weight: 800;
  border-bottom: 2px solid var(--accent);
  background: rgba(184, 138, 46, 0.08);
}

.tab-btn:focus-visible {
  outline: 2px solid rgba(184, 138, 46, 0.40);
  outline-offset: -3px;
  border-radius: 4px;
}

.tab-btn:hover:not(.active) {
  color: var(--text-muted);
}
</style>
