<script setup lang="ts">
import { computed, ref } from 'vue';
import type { CasualtyPoint } from '@/domain/types';

const props = defineProps<{
  series: readonly CasualtyPoint[];
  currentTimeSec: number;
}>();

const W = 320;
const H = 82;
const M_T = 6;
const M_R = 8;
const M_B = 12;
const M_L = 24;

const svgRef = ref<SVGSVGElement | null>(null);

// Only show points up to current time (dynamic unfold)
const visibleSeries = computed(() =>
  props.series.filter((p) => p.timeSec <= props.currentTimeSec),
);

// Stable axis max time — prevents chart from jumping on early ticks
const axisMaxTime = computed(() => {
  const lastSeriesTime = props.series.at(-1)?.timeSec ?? 1;
  return Math.max(lastSeriesTime, props.currentTimeSec, 1);
});

function plotW() { return W - M_L - M_R; }
function plotH() { return H - M_T - M_B; }
function timeToX(t: number) { return M_L + (t / axisMaxTime.value) * plotW(); }
function pctToY(pct: number) { return M_T + (1 - pct / 100) * plotH(); }

// Build display points: fill single-point with a horizontal line
interface DispPt { timeSec: number; pct: number; }
function buildDisp(side: 'red' | 'blue'): DispPt[] {
  const vs = visibleSeries.value;
  if (vs.length === 0) return [{ timeSec: 0, pct: 100 }, { timeSec: Math.min(axisMaxTime.value, 1), pct: 100 }];
  const pts = vs.map((p) => ({ timeSec: p.timeSec, pct: side === 'red' ? p.redHpPct : p.blueHpPct }));
  if (pts.length === 1) pts.push({ timeSec: Math.max(axisMaxTime.value, props.currentTimeSec || 1), pct: pts[0]!.pct });
  return pts;
}

const redPoints = computed(() =>
  buildDisp('red').map((p) => `${timeToX(p.timeSec)},${pctToY(p.pct)}`).join(' '),
);
const bluePoints = computed(() =>
  buildDisp('blue').map((p) => `${timeToX(p.timeSec)},${pctToY(p.pct)}`).join(' '),
);

const probeNowX = computed(() => timeToX(props.currentTimeSec));

const currentRed = computed(() => {
  const vs = visibleSeries.value;
  return vs.length > 0 ? vs[vs.length - 1]!.redHpPct : 100;
});
const currentBlue = computed(() => {
  const vs = visibleSeries.value;
  return vs.length > 0 ? vs[vs.length - 1]!.blueHpPct : 100;
});

// —— hover state ——
const hoverPoint = ref<CasualtyPoint | null>(null);
const hoverX = ref<number | null>(null);

function findNearest(series: readonly CasualtyPoint[], targetTime: number): CasualtyPoint | null {
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
  const pLocalX = Math.max(0, Math.min(plotW(), localX - M_L));
  const ratio = plotW() <= 0 ? 0 : pLocalX / plotW();
  const vs = visibleSeries.value;
  if (vs.length === 0) return;
  const minT = vs[0]!.timeSec;
  const maxT = vs[vs.length - 1]!.timeSec;
  const nearest = findNearest(vs, minT + ratio * (maxT - minT));
  if (nearest) { hoverPoint.value = nearest; hoverX.value = timeToX(nearest.timeSec); }
}

function onMouseLeave() { hoverPoint.value = null; hoverX.value = null; }

const redR = computed(() => hoverPoint.value ? Math.round(hoverPoint.value.redHpPct) : 100);
const blueR = computed(() => hoverPoint.value ? Math.round(hoverPoint.value.blueHpPct) : 100);
</script>

<template>
  <section class="cc-card">
    <div class="cc-header">
      <span class="cc-title">战损</span>
      <span class="cc-legend">
        <span class="cc-red">红 {{ currentRed.toFixed(0) }}%</span>
        <span class="cc-blue">蓝 {{ currentBlue.toFixed(0) }}%</span>
      </span>
    </div>
    <svg
      ref="svgRef"
      class="cc-chart"
      :viewBox="`0 0 ${W} ${H}`"
      @mousemove="onMouseMove"
      @mouseleave="onMouseLeave"
    >
      <!-- grid lines -->
      <line :x1="M_L" :y1="pctToY(100)" :x2="W - M_R" :y2="pctToY(100)" class="cc-grid cc-grid-main" />
      <line :x1="M_L" :y1="pctToY(50)" :x2="W - M_R" :y2="pctToY(50)" class="cc-grid" />
      <line :x1="M_L" :y1="pctToY(0)" :x2="W - M_R" :y2="pctToY(0)" class="cc-grid cc-grid-main" />
      <!-- y labels -->
      <text :x="M_L - 4" :y="pctToY(100)" text-anchor="end" dominant-baseline="middle" class="cc-ax-lbl">100%</text>
      <text :x="M_L - 4" :y="pctToY(50)" text-anchor="end" dominant-baseline="middle" class="cc-ax-lbl">50%</text>
      <text :x="M_L - 4" :y="pctToY(0)" text-anchor="end" dominant-baseline="middle" class="cc-ax-lbl">0%</text>
      <!-- x labels -->
      <text :x="M_L" :y="H - 2" class="cc-ax-lbl">0s</text>
      <text :x="W - M_R" :y="H - 2" text-anchor="end" class="cc-ax-lbl">{{ axisMaxTime }}s</text>
      <!-- curves -->
      <polyline :points="redPoints" class="cc-line cc-line-red" />
      <polyline :points="bluePoints" class="cc-line cc-line-blue" />
      <!-- current-time probe -->
      <line :x1="probeNowX" :y1="pctToY(100)" :x2="probeNowX" :y2="pctToY(0)" class="cc-probe-now" />
      <!-- hover probe -->
      <line v-if="hoverX !== null" :x1="hoverX" :y1="pctToY(100)" :x2="hoverX" :y2="pctToY(0)" class="cc-probe-hover" />
      <circle v-if="hoverX !== null" :cx="hoverX" :cy="pctToY(hoverPoint?.redHpPct ?? 100)" r="3" class="cc-dot-red" />
      <circle v-if="hoverX !== null" :cx="hoverX" :cy="pctToY(hoverPoint?.blueHpPct ?? 100)" r="3" class="cc-dot-blue" />
    </svg>
    <!-- hover tooltip -->
    <div v-if="hoverPoint !== null" class="cc-tip">
      <div class="cc-tip-time">T{{ hoverPoint.timeSec }}s</div>
      <div><span class="cc-red">●</span> 红 剩{{ redR }}% 损{{ 100 - redR }}%</div>
      <div><span class="cc-blue">●</span> 蓝 剩{{ blueR }}% 损{{ 100 - blueR }}%</div>
    </div>
  </section>
</template>

<style scoped>
.cc-card {
  border-top: 1px solid var(--panel-divider);
  background: var(--panel-card);
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
  padding: 0 4px 4px;
}
.cc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 16px;
  padding: 0 2px;
}
.cc-title { font-size: 10px; font-weight: 700; color: var(--derived-title); }
.cc-legend { display: flex; gap: 8px; font-size: 9px; line-height: 1; }
.cc-red { color: #B85A4D; font-weight: 700; font-family: ui-monospace, monospace; }
.cc-blue { color: #4A7EA8; font-weight: 700; font-family: ui-monospace, monospace; }
.cc-chart {
  display: block;
  width: 100%;
  height: 76px;
  background: var(--input-bg);
}
.cc-grid { stroke: rgba(90, 80, 60, 0.18); stroke-width: 1; stroke-dasharray: 2 2; }
.cc-grid-main { stroke-dasharray: none; stroke: rgba(90, 80, 60, 0.28); }
.cc-ax-lbl { fill: var(--text-dim); font-size: 7px; }
.cc-line { fill: none; stroke-width: 1.7; stroke-linejoin: round; stroke-linecap: round; }
.cc-line-red { stroke: #B85A4D; }
.cc-line-blue { stroke: #4A7EA8; }
.cc-probe-now { stroke: rgba(80, 60, 30, 0.35); stroke-width: 1; stroke-dasharray: 2 2; }
.cc-probe-hover { stroke: rgba(80, 60, 30, 0.65); stroke-width: 1; stroke-dasharray: 3 3; pointer-events: none; }
.cc-dot-red { fill: #B85A4D; stroke: #fff; stroke-width: 1; pointer-events: none; }
.cc-dot-blue { fill: #4A7EA8; stroke: #fff; stroke-width: 1; pointer-events: none; }
.cc-tip {
  position: absolute;
  right: 6px;
  top: 18px;
  z-index: 2;
  background: rgba(50, 44, 30, 0.9);
  color: #f0e8d0;
  font-size: 8px;
  padding: 3px 5px;
  border-radius: 3px;
  line-height: 1.35;
  pointer-events: none;
  white-space: nowrap;
}
.cc-tip-time { font-weight: 700; margin-bottom: 1px; }
</style>
