<script setup lang="ts">
import { computed, ref } from 'vue';
import type { CasualtyPoint } from '@/domain/types';

const props = defineProps<{
  series: readonly CasualtyPoint[];
  currentTimeSec: number;
}>();

const W = 280;
const H = 100;
const M_T = 6;
const M_R = 10;
const M_B = 16;
const M_L = 28;

const svgRef = ref<SVGSVGElement | null>(null);

const maxTime = computed(() => {
  if (props.series.length === 0) return 10;
  return Math.max(props.series[props.series.length - 1]!.timeSec, 1);
});

function plotW() { return W - M_L - M_R; }
function plotH() { return H - M_T - M_B; }
function timeToX(t: number) { return M_L + (t / maxTime.value) * plotW(); }
function pctToY(pct: number) { return M_T + (1 - pct / 100) * plotH(); }

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

// —— hover state ——
const hoverTime = ref<number | null>(null);
const hoverPoint = ref<CasualtyPoint | null>(null);
const hoverX = ref<number | null>(null);

function findNearestPoint(series: readonly CasualtyPoint[], targetTime: number): CasualtyPoint | null {
  if (series.length === 0) return null;
  let best = series[0]!;
  let bestDist = Math.abs(best.timeSec - targetTime);
  for (let i = 1; i < series.length; i++) {
    const dist = Math.abs(series[i]!.timeSec - targetTime);
    if (dist < bestDist) { bestDist = dist; best = series[i]!; }
  }
  return best;
}

function onMouseMove(ev: MouseEvent) {
  const svg = svgRef.value;
  if (!svg) return;
  const rect = svg.getBoundingClientRect();
  const scaleX = W / rect.width;
  const localX = (ev.clientX - rect.left) * scaleX;
  const plotLocalX = Math.max(0, Math.min(plotW(), localX - M_L));
  const ratio = plotW() <= 0 ? 0 : plotLocalX / plotW();
  const seriesLen = props.series.length;
  const minT = seriesLen > 0 ? props.series[0]!.timeSec : 0;
  const maxT = seriesLen > 0 ? props.series[seriesLen - 1]!.timeSec : 0;
  const targetT = minT + ratio * (maxT - minT);
  const nearest = findNearestPoint(props.series, targetT);
  if (nearest) {
    hoverPoint.value = nearest;
    hoverTime.value = nearest.timeSec;
    hoverX.value = timeToX(nearest.timeSec);
  }
}

function onMouseLeave() {
  hoverTime.value = null;
  hoverPoint.value = null;
  hoverX.value = null;
}

const redRemainPct = computed(() => hoverPoint.value ? Math.round(hoverPoint.value.redHpPct) : 100);
const blueRemainPct = computed(() => hoverPoint.value ? Math.round(hoverPoint.value.blueHpPct) : 100);
const redLossPct = computed(() => 100 - redRemainPct.value);
const blueLossPct = computed(() => 100 - blueRemainPct.value);
</script>

<template>
  <section class="cc-card">
    <div class="cc-header">
      <span class="cc-title">战损统计</span>
      <span class="cc-legend">
        <span class="cc-red">蓝方 {{ currentRed.toFixed(0) }}%</span>
        <span class="cc-blue">红方 {{ currentBlue.toFixed(0) }}%</span>
      </span>
    </div>
    <svg
      ref="svgRef"
      class="cc-chart"
      :viewBox="`0 0 ${W} ${H}`"
      @mousemove="onMouseMove"
      @mouseleave="onMouseLeave"
    >
      <!-- axes -->
      <line :x1="M_L" :y1="M_T" :x2="M_L" :y2="H - M_B" class="cc-axis" />
      <line :x1="M_L" :y1="H - M_B" :x2="W - M_R" :y2="H - M_B" class="cc-axis" />
      <!-- y labels -->
      <text :x="M_L - 4" :y="M_T + 2" text-anchor="end" class="cc-ax-lbl">100%</text>
      <text :x="M_L - 4" :y="M_T + plotH() / 2" text-anchor="end" class="cc-ax-lbl">50%</text>
      <text :x="M_L - 4" :y="H - M_B" text-anchor="end" class="cc-ax-lbl">0%</text>
      <!-- x labels -->
      <text :x="M_L" :y="H - 2" class="cc-ax-lbl">0s</text>
      <text :x="W - M_R" :y="H - 2" text-anchor="end" class="cc-ax-lbl">{{ maxTime }}s</text>
      <!-- red line -->
      <polyline :points="redPoints" class="cc-line cc-line-red" />
      <!-- blue line -->
      <polyline :points="bluePoints" class="cc-line cc-line-blue" />
      <!-- current-time probe -->
      <line :x1="probeX" :y1="M_T" :x2="probeX" :y2="H - M_B" class="cc-probe-now" />
      <!-- hover probe -->
      <line v-if="hoverX !== null" :x1="hoverX" :y1="M_T" :x2="hoverX" :y2="H - M_B" class="cc-probe-hover" />
      <circle v-if="hoverX !== null" :cx="hoverX" :cy="pctToY(hoverPoint?.redHpPct ?? 100)" r="3" class="cc-dot-red" />
      <circle v-if="hoverX !== null" :cx="hoverX" :cy="pctToY(hoverPoint?.blueHpPct ?? 100)" r="3" class="cc-dot-blue" />
    </svg>
    <!-- hover tooltip -->
    <div v-if="hoverTime !== null" class="cc-tip">
      <div class="cc-tip-time">T+{{ hoverTime }}s</div>
      <div class="cc-tip-row"><span class="cc-red">●</span> 蓝方 剩余{{ redRemainPct }}%｜战损{{ redLossPct }}%</div>
      <div class="cc-tip-row"><span class="cc-blue">●</span> 红方 剩余{{ blueRemainPct }}%｜战损{{ blueLossPct }}%</div>
    </div>
  </section>
</template>

<style scoped>
.cc-card {
  border-top: 1px solid var(--panel-divider);
  background: var(--panel-card);
  flex-shrink: 0;
  position: relative;
}
.cc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 22px;
  padding: 0 8px;
}
.cc-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--derived-title);
}
.cc-legend {
  display: flex;
  gap: 8px;
  font-size: 10px;
}
.cc-red { color: #B85A4D; font-weight: 700; font-family: ui-monospace, monospace; }
.cc-blue { color: #4A7EA8; font-weight: 700; font-family: ui-monospace, monospace; }
.cc-chart {
  display: block;
  width: 100%;
  height: 95px;
  background: var(--input-bg);
}
.cc-axis { stroke: var(--panel-divider); stroke-width: 1; }
.cc-ax-lbl { fill: var(--text-dim); font-size: 8px; }
.cc-line { fill: none; stroke-width: 1.5; stroke-linejoin: round; }
.cc-line-red { stroke: #B85A4D; }
.cc-line-blue { stroke: #4A7EA8; }
.cc-probe-now { stroke: var(--panel-divider); stroke-width: 1; stroke-dasharray: 2 2; }
.cc-probe-hover { stroke: rgba(80, 60, 30, 0.55); stroke-width: 1; stroke-dasharray: 3 3; pointer-events: none; }
.cc-dot-red { fill: #B85A4D; stroke: #fff; stroke-width: 1; pointer-events: none; }
.cc-dot-blue { fill: #4A7EA8; stroke: #fff; stroke-width: 1; pointer-events: none; }
.cc-tip {
  position: absolute;
  left: 10px;
  bottom: 100px;
  background: rgba(50, 44, 30, 0.92);
  color: #f0e8d0;
  font-size: 10px;
  padding: 4px 8px;
  border-radius: 4px;
  line-height: 1.5;
  pointer-events: none;
  white-space: nowrap;
}
.cc-tip-time { font-weight: 700; margin-bottom: 2px; }
.cc-tip-row { display: flex; align-items: center; gap: 3px; }
.cc-tip-row .cc-red,
.cc-tip-row .cc-blue { font-size: 9px; }
</style>
