<script setup lang="ts">
import { computed } from 'vue';
import type { CasualtyPoint } from '@/domain/types';

const props = defineProps<{
  series: readonly CasualtyPoint[];
  currentTimeSec: number;
}>();

const W = 280;
const H = 110;
const PAD_L = 30;
const PAD_R = 8;
const PAD_T = 12;
const PAD_B = 20;

const maxTime = computed(() => {
  if (props.series.length === 0) return 10;
  return Math.max(props.series[props.series.length - 1]!.timeSec, 1);
});

function plotW() { return W - PAD_L - PAD_R; }
function plotH() { return H - PAD_T - PAD_B; }
function timeToX(t: number) { return PAD_L + (t / maxTime.value) * plotW(); }
function pctToY(pct: number) { return PAD_T + (1 - pct / 100) * plotH(); }

const redPoints = computed(() =>
  props.series.map((p) => `${timeToX(p.timeSec)},${pctToY(p.redHpPct)}`).join(' '),
);
const bluePoints = computed(() =>
  props.series.map((p) => `${timeToX(p.timeSec)},${pctToY(p.blueHpPct)}`).join(' '),
);

const probeX = computed(() => timeToX(props.currentTimeSec));

const currentRed = computed(() => {
  const p = [...props.series].reverse().find((p) => p.timeSec <= props.currentTimeSec);
  return p?.redHpPct ?? 100;
});
const currentBlue = computed(() => {
  const p = [...props.series].reverse().find((p) => p.timeSec <= props.currentTimeSec);
  return p?.blueHpPct ?? 100;
});
</script>

<template>
  <section class="cc-card">
    <div class="cc-header">战损统计</div>
    <div class="cc-summary">
      <span class="cc-red">蓝方 {{ currentRed.toFixed(0) }}%</span>
      <span class="cc-blue">红方 {{ currentBlue.toFixed(0) }}%</span>
    </div>
    <svg class="cc-chart" :viewBox="`0 0 ${W} ${H}`">
      <!-- axes -->
      <line :x1="PAD_L" :y1="PAD_T" :x2="PAD_L" :y2="H - PAD_B" class="cc-axis" />
      <line :x1="PAD_L" :y1="H - PAD_B" :x2="W - PAD_R" :y2="H - PAD_B" class="cc-axis" />
      <!-- y labels -->
      <text :x="PAD_L - 4" :y="PAD_T" text-anchor="end" class="cc-ax-lbl">100%</text>
      <text :x="PAD_L - 4" :y="H - PAD_B" text-anchor="end" class="cc-ax-lbl">0%</text>
      <!-- x label -->
      <text :x="W - PAD_R" :y="H - 4" text-anchor="end" class="cc-ax-lbl">t</text>
      <!-- red line -->
      <polyline :points="redPoints" class="cc-line cc-line-red" />
      <!-- blue line -->
      <polyline :points="bluePoints" class="cc-line cc-line-blue" />
      <!-- probe line -->
      <line :x1="probeX" :y1="PAD_T" :x2="probeX" :y2="H - PAD_B" class="cc-probe" />
    </svg>
  </section>
</template>

<style scoped>
.cc-card {
  border-top: 1px solid var(--panel-divider);
  padding: 6px 8px;
  background: var(--panel-card);
  flex-shrink: 0;
}
.cc-header {
  font-size: 11px;
  font-weight: 600;
  color: var(--derived-title);
  margin-bottom: 2px;
}
.cc-summary {
  display: flex;
  gap: 12px;
  font-size: 11px;
  margin-bottom: 4px;
}
.cc-red {
  color: #B85A4D;
  font-weight: 700;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
.cc-blue {
  color: #4A7EA8;
  font-weight: 700;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
.cc-chart {
  display: block;
  width: 100%;
  height: 100px;
  background: var(--input-bg);
  border-radius: 4px;
}
.cc-axis { stroke: var(--panel-divider); stroke-width: 1; }
.cc-ax-lbl { fill: var(--text-dim); font-size: 8px; }
.cc-line { fill: none; stroke-width: 1.5; stroke-linejoin: round; }
.cc-line-red { stroke: #B85A4D; }
.cc-line-blue { stroke: #4A7EA8; }
.cc-probe { stroke: var(--panel-divider); stroke-width: 1; stroke-dasharray: 2 2; }
</style>
