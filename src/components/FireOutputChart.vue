<script setup lang="ts">
import { computed, ref } from 'vue';
import type { WeaponProfile } from '@/domain/types';
import {
  calculateFireOutput,
  type TargetType,
} from '@/domain/fireOutput';
import {
  generateFireOutputCurve,
  generateFireOutputTargetTable,
} from '@/domain/fireOutputCurve';
import { formatTargetType, formatRangeBand, formatEffectClass } from '@/domain/fireOutputFormat';

const props = defineProps<{ weapon: WeaponProfile }>();

// chart layout constants
const W = 280;
const H = 130;
const PAD_L = 26;
const PAD_R = 8;
const PAD_T = 14;
const PAD_B = 22;

const probeRangeM = ref(100);
const locked = ref(false);

const curve = computed(() => generateFireOutputCurve(props.weapon, 'personnel', 'none'));
const maxCurveValue = computed(() => Math.max(...curve.value.map((p) => p.value), 0.01));

function plotW() { return W - PAD_L - PAD_R; }
function plotH() { return H - PAD_T - PAD_B; }
function rangeToX(r: number) { return PAD_L + (r / 1000) * plotW(); }
function valueToY(v: number) {
  const m = maxCurveValue.value;
  return PAD_T + (1 - Math.max(0, Math.min(m, v)) / m) * plotH();
}
function xToRange(lx: number) {
  return Math.round(Math.max(0, Math.min(1, (lx - PAD_L) / plotW())) * 1000);
}

const polylinePoints = computed(() =>
  curve.value.map((p) => `${rangeToX(p.rangeM)},${valueToY(p.value)}`).join(' '),
);

const probeResult = computed(() =>
  calculateFireOutput(props.weapon, { rangeM: probeRangeM.value, targetType: 'personnel', protectionLevel: 'none' }),
);
const probeX = computed(() => rangeToX(probeRangeM.value));
const probeY = computed(() => valueToY(probeResult.value.value));

const targetRows = computed(() =>
  generateFireOutputTargetTable(props.weapon, probeRangeM.value, 'none'),
);

function onMove(ev: MouseEvent) {
  if (locked.value) return;
  const svg = ev.currentTarget as SVGSVGElement;
  const rect = svg.getBoundingClientRect();
  const sx = (ev.clientX - rect.left) * (W / rect.width);
  probeRangeM.value = xToRange(sx);
}

function onClick(ev: MouseEvent) {
  const svg = ev.currentTarget as SVGSVGElement;
  const rect = svg.getBoundingClientRect();
  const sx = (ev.clientX - rect.left) * (W / rect.width);
  probeRangeM.value = xToRange(sx);
  locked.value = true;
}

function unlock() { locked.value = false; }
</script>

<template>
  <section class="fo-card">
    <div class="fo-header">
      <span class="fo-title">火力输出 FireOutput</span>
      <button v-if="locked" class="fo-unlock" type="button" @click="unlock">解除锁定</button>
    </div>
    <div class="fo-meta">
      <span>效果等级：{{ formatEffectClass(weapon.effectClass) }}</span>
      <span>输出模式：{{ weapon.outputMode }}</span>
    </div>

    <div class="fo-probe">
      <span>当前距离：<strong>{{ probeRangeM }}m</strong></span>
      <span>人员输出：<strong>{{ probeResult.value.toFixed(2) }}</strong></span>
      <span>距离段：<strong>{{ formatRangeBand(probeResult.rangeBand) }}</strong></span>
    </div>

    <div class="fo-tbl-label">目标输出（当前：{{ probeRangeM }}m）</div>
    <div class="fo-tbl">
      <div v-for="row in targetRows" :key="row.targetType" class="fo-row">
        <span>{{ formatTargetType(row.targetType) }}</span>
        <strong>{{ row.value.toFixed(2) }}</strong>
      </div>
    </div>

    <div class="fo-tbl-label">距离-人员火力输出曲线</div>
    <svg
      class="fo-chart"
      :viewBox="`0 0 ${W} ${H}`"
      @mousemove="onMove"
      @click="onClick"
    >
      <!-- axes -->
      <line :x1="PAD_L" :y1="PAD_T" :x2="PAD_L" :y2="H - PAD_B" class="fo-axis" />
      <line :x1="PAD_L" :y1="H - PAD_B" :x2="W - PAD_R" :y2="H - PAD_B" class="fo-axis" />
      <!-- x labels -->
      <text :x="PAD_L" :y="H - 4" class="fo-ax-label">0</text>
      <text :x="rangeToX(500)" :y="H - 4" text-anchor="middle" class="fo-ax-label">500m</text>
      <text :x="W - PAD_R" :y="H - 4" text-anchor="end" class="fo-ax-label">1000m</text>
      <!-- y hint -->
      <text :x="PAD_L - 4" :y="PAD_T + 4" text-anchor="end" class="fo-ax-label">输出</text>
      <!-- curve -->
      <polyline :points="polylinePoints" class="fo-curve" />
      <!-- probe -->
      <line :x1="probeX" :y1="PAD_T" :x2="probeX" :y2="H - PAD_B" class="fo-probe-ln" />
      <circle :cx="probeX" :cy="probeY" r="4" class="fo-probe-dot" />
      <text
        :x="probeX + 6"
        :y="Math.max(PAD_T + 10, probeY - 6)"
        class="fo-probe-txt"
      >{{ probeRangeM }}m / {{ probeResult.value.toFixed(2) }}</text>
      <!-- range band backgrounds -->
      <text :x="rangeToX(75)" :y="H - PAD_B + 14" text-anchor="middle" class="fo-band-lbl">近距</text>
      <text :x="rangeToX(225)" :y="H - PAD_B + 14" text-anchor="middle" class="fo-band-lbl">中距</text>
      <text :x="rangeToX(400)" :y="H - PAD_B + 14" text-anchor="middle" class="fo-band-lbl">远距</text>
      <text :x="rangeToX(750)" :y="H - PAD_B + 14" text-anchor="middle" class="fo-band-lbl">极限</text>
    </svg>
  </section>
</template>

<style scoped>
.fo-card {
  margin-top: 8px;
  padding: 8px;
  background: var(--derived-bg);
  border: 1px solid var(--derived-border);
  border-radius: 4px;
}
.fo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--derived-border);
  padding-bottom: 4px;
  margin-bottom: 6px;
}
.fo-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--derived-title);
  letter-spacing: 0.3px;
}
.fo-unlock {
  font-size: 10px;
  padding: 1px 6px;
  border: 1px solid var(--panel-border);
  border-radius: 3px;
  background: var(--panel-card-soft);
  color: var(--text-muted);
  cursor: pointer;
}
.fo-meta {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 6px;
  line-height: 1.5;
}
.fo-probe {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px 8px;
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 8px;
}
.fo-probe strong {
  color: var(--derived-text);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
.fo-tbl-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--derived-title);
  margin-bottom: 3px;
}
.fo-tbl {
  margin-bottom: 8px;
}
.fo-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  line-height: 1.6;
}
.fo-row span { color: var(--text-muted); }
.fo-row strong {
  color: var(--derived-text);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
.fo-chart {
  display: block;
  width: 100%;
  height: 130px;
  background: var(--input-bg);
  border-radius: 4px;
  cursor: crosshair;
}
.fo-axis { stroke: var(--panel-divider); stroke-width: 1; }
.fo-ax-label { fill: var(--text-dim); font-size: 9px; }
.fo-curve { fill: none; stroke: #b87a16; stroke-width: 2; stroke-linejoin: round; }
.fo-probe-ln { stroke: rgba(70, 88, 120, 0.5); stroke-width: 1; stroke-dasharray: 3 3; }
.fo-probe-dot { fill: #c7982b; stroke: #674900; stroke-width: 1; }
.fo-probe-txt {
  fill: #40351f;
  font-size: 9px;
  paint-order: stroke;
  stroke: rgba(255, 248, 220, 0.85);
  stroke-width: 3;
}
.fo-band-lbl { fill: var(--text-dim); font-size: 8px; opacity: 0.6; }
</style>
