<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useGameStore } from '@/stores/gameStore';
import { deriveWeaponStats } from '@/domain/weapon';
import { formatEffectClass } from '@/domain/fireOutputFormat';
import type { CombatProfile, WeaponAction } from '@/domain/types';
import FireOutputChart from './FireOutputChart.vue';

const game = useGameStore();
const { units, uiPanelTab, highlightedUnitId } = storeToRefs(game);

const selectedIdx = ref(0);

function blankProfile(): CombatProfile {
  return {
    id: '', name: '', faction: 'blue',
    states: { stamina: 50, morale: 50, focus: 50 },
    forces: { strike: 50, survival: 50, mobility: 50, perception: 50, control: 50, sustainment: 50 },
    weapon: { id: '', name: '', caliber: 7.62, action: 'bolt', barrelLength: 600, sightMag: 1.0, family: 'bolt_action_rifle', outputMode: 'kinetic_single', effectClass: 'full_power_rifle' },
    woundState: 'healthy',
  };
}

function cloneProfile(p: CombatProfile): CombatProfile {
  return JSON.parse(JSON.stringify(p)) as CombatProfile;
}

const editing = reactive<CombatProfile>(cloneProfile(units.value[0]?.combatProfile ?? blankProfile()));

const unitLabel = computed(() => units.value[selectedIdx.value]?.id ?? '');

function loadUnit(idx: number): void {
  const src = units.value[idx]?.combatProfile;
  if (!src) return;
  Object.assign(editing, cloneProfile(src));
  highlightedUnitId.value = units.value[idx]?.id ?? null;
}

watch(selectedIdx, (idx) => loadUnit(idx));

// Sync from highlightedUnitId → selectedIdx when canvas selects a unit
watch(highlightedUnitId, (id) => {
  if (id === null) return;
  const idx = units.value.findIndex((u) => u.id === id);
  if (idx >= 0 && idx !== selectedIdx.value) {
    selectedIdx.value = idx;
  }
});

const weaponStats = computed(() => deriveWeaponStats(editing.weapon));
const weaponExpanded = ref(false);

function apply(): void {
  const unit = units.value[selectedIdx.value];
  if (!unit) return;
  unit.combatProfile = cloneProfile(editing);
}

const actionOptions: { value: WeaponAction; label: string }[] = [
  { value: 'bolt', label: '栓动 (bolt)' },
  { value: 'semi', label: '半自动 (semi)' },
  { value: 'auto', label: '全自动 (auto)' },
];

function weaponTypeLabel(): string {
  const cat = editing.weapon.category ?? (editing.weapon.action === 'bolt' ? 'rifle' : 'rifle');
  const catMap: Record<string, string> = { rifle: '步枪', machine_gun: '机枪', mortar: '迫击炮', anti_tank: '反坦克', artillery: '火炮' };
  return catMap[cat] ?? '步枪';
}

function actionLabel(): string {
  const m: Record<string, string> = { bolt: '栓动', semi: '半自动', auto: '全自动' };
  return m[editing.weapon.action] ?? '栓动';
}

function factionLabel(): string {
  return editing.faction === 'blue' ? '蓝方' : '红方';
}
</script>

<template>
  <div class="unit-editor">
    <!-- 当前单位摘要 -->
    <div class="editor-card">
      <div class="card-title">当前单位</div>
      <div class="unit-summary">
        <div class="unit-summary-name">{{ editing.name }}</div>
        <div class="unit-summary-tags">{{ factionLabel() }} ｜ {{ editing.weapon.name || '未挂载' }} ｜ {{ formatEffectClass(editing.weapon.effectClass) }}</div>
      </div>
    </div>

    <!-- 基本信息卡片 -->
    <div class="editor-card">
      <div class="card-title">基本信息</div>
      <div class="field-row">
        <span class="field-label">名称</span>
        <input v-model="editing.name" type="text" class="field-input" />
      </div>
    </div>

    <!-- 三状态卡片 -->
    <div class="editor-card">
      <div class="card-title">三状态</div>
      <div class="stat-row">
        <span class="field-label">体能</span>
        <input v-model.number="editing.states.stamina" type="number" min="0" max="100" class="field-num" />
      </div>
      <div class="stat-row">
        <span class="field-label">士气</span>
        <input v-model.number="editing.states.morale" type="number" min="0" max="100" class="field-num" />
      </div>
      <div class="stat-row">
        <span class="field-label">专注</span>
        <input v-model.number="editing.states.focus" type="number" min="0" max="100" class="field-num" />
      </div>
    </div>

    <!-- 六力卡片（两列） -->
    <div class="editor-card">
      <div class="card-title">六力</div>
      <div class="force-grid">
        <span class="field-label">打击力</span>
        <input v-model.number="editing.forces.strike" type="number" min="0" max="100" class="field-num" />
        <span class="field-label">生存力</span>
        <input v-model.number="editing.forces.survival" type="number" min="0" max="100" class="field-num" />
        <span class="field-label">机动力</span>
        <input v-model.number="editing.forces.mobility" type="number" min="0" max="100" class="field-num" />
        <span class="field-label">感知力</span>
        <input v-model.number="editing.forces.perception" type="number" min="0" max="100" class="field-num" />
        <span class="field-label">控制力</span>
        <input v-model.number="editing.forces.control" type="number" min="0" max="100" class="field-num" />
        <span class="field-label">保障力</span>
        <input v-model.number="editing.forces.sustainment" type="number" min="0" max="100" class="field-num" />
      </div>
    </div>

    <!-- 武器挂载卡片（可折叠） -->
    <div class="editor-card">
      <div class="card-title weapon-mount-title" @click="weaponExpanded = !weaponExpanded">
        <span>武器挂载</span>
        <span class="collapse-icon">{{ weaponExpanded ? '▼' : '▶' }}</span>
      </div>
      <!-- 折叠摘要 -->
      <div v-if="!weaponExpanded" class="mount-summary">
        <div class="mount-name">{{ editing.weapon.name || '未挂载' }}</div>
        <div class="mount-tags">{{ weaponTypeLabel() }} ｜ 直射 ｜ {{ actionLabel() }}</div>
        <div class="mount-specs">{{ editing.weapon.caliber }}mm ｜ 枪管 {{ editing.weapon.barrelLength }}mm ｜ 瞄具 {{ editing.weapon.sightMag }}x</div>
      </div>
      <!-- 展开详情 -->
      <div v-if="weaponExpanded">
        <div class="field-row">
          <span class="field-label">名称</span>
          <input v-model="editing.weapon.name" type="text" class="field-input" />
        </div>
        <div class="field-row">
          <span class="field-label">口径 (mm)</span>
          <input v-model.number="editing.weapon.caliber" type="number" min="0" step="0.01" class="field-num" />
        </div>
        <div class="field-row">
          <span class="field-label">枪机</span>
          <select v-model="editing.weapon.action" class="field-select">
            <option v-for="o in actionOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>
        <div class="field-row">
          <span class="field-label">枪管长 (mm)</span>
          <input v-model.number="editing.weapon.barrelLength" type="number" min="0" class="field-num" />
        </div>
        <div class="field-row">
          <span class="field-label">瞄具倍率</span>
          <input v-model.number="editing.weapon.sightMag" type="number" min="0" step="0.1" class="field-num" />
        </div>
        <div class="derived-section">
          <div class="derived-subtitle">算法推导</div>
          <div class="derived-row"><span>武器精度</span><strong>{{ weaponStats.weaponAccuracy.toFixed(3) }}</strong></div>
          <div class="derived-row"><span>有效射程</span><strong>{{ weaponStats.effectiveRange.toFixed(0) }} m</strong></div>
          <div class="derived-row"><span>旧终端系数</span><strong>{{ weaponStats.terminalEffect.toFixed(3) }}</strong></div>
          <div class="derived-row"><span>射击节奏</span><strong>{{ weaponStats.fireTempo.toFixed(2) }}</strong></div>
        </div>

        <!-- 火力输出 FireOutput 交互图 -->
        <FireOutputChart :weapon="editing.weapon" />
      </div>
    </div>

    <!-- 应用参数 -->
    <button class="apply-btn" @click="apply">应用参数</button>
  </div>
</template>

<style scoped>
.unit-editor {
  flex: 1;
  padding: 10px 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.editor-card {
  background: var(--panel-card);
  border: 1px solid var(--panel-border);
  border-radius: 6px;
  padding: 10px 12px;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #A07D2A;
  border-bottom: 1px solid var(--panel-divider);
  padding-bottom: 6px;
  margin-bottom: 10px;
  letter-spacing: 0.3px;
}

.unit-summary {
  text-align: center;
}
.unit-summary-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-main);
}
.unit-summary-tags {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}

.field-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.field-label {
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.5;
  flex: 0 0 80px;
}

.field-num {
  width: 80px;
  padding: 4px 6px;
  background: var(--input-bg);
  color: var(--text-main);
  border: 1px solid var(--input-border);
  border-radius: 4px;
  font-size: 13px;
  text-align: right;
  height: 26px;
  box-sizing: border-box;
}

.field-num:focus {
  outline: none;
  border-color: var(--input-focus);
  box-shadow: 0 0 0 2px rgba(184, 138, 46, 0.18);
}

.field-input {
  flex: 1;
  padding: 4px 6px;
  background: var(--input-bg);
  color: var(--text-main);
  border: 1px solid var(--input-border);
  border-radius: 4px;
  font-size: 13px;
  height: 26px;
  box-sizing: border-box;
}

.field-input:focus {
  outline: none;
  border-color: var(--input-focus);
  box-shadow: 0 0 0 2px rgba(184, 138, 46, 0.18);
}

.field-select {
  width: 140px;
  padding: 4px 6px;
  background: var(--input-bg);
  color: var(--text-main);
  border: 1px solid var(--input-border);
  border-radius: 4px;
  font-size: 13px;
  height: 26px;
  box-sizing: border-box;
}

.field-select:focus {
  outline: none;
  border-color: var(--input-focus);
}

.stat-row {
  display: grid;
  grid-template-columns: 1fr 80px;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.force-grid {
  display: grid;
  grid-template-columns: 1fr 80px 1fr 80px;
  gap: 8px 10px;
  align-items: center;
}

.weapon-mount-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.collapse-icon {
  font-size: 11px;
  color: var(--text-dim);
}

.mount-summary {
  font-size: 13px;
  line-height: 1.6;
}

.mount-name {
  font-weight: 700;
  color: var(--text-main);
}

.mount-tags {
  color: var(--accent);
  font-size: 12px;
}

.mount-specs {
  color: var(--text-dim);
  font-size: 12px;
}

.derived-section {
  margin-top: 10px;
  padding: 8px;
  background: var(--derived-bg);
  border: 1px solid var(--derived-border);
  border-radius: 4px;
}

.derived-subtitle {
  font-size: 12px;
  font-weight: 600;
  color: var(--derived-title);
  border-bottom: 1px solid var(--derived-border);
  padding-bottom: 4px;
  margin-bottom: 8px;
  letter-spacing: 0.3px;
}

.derived-row {
  display: grid;
  grid-template-columns: 1fr auto;
  margin-bottom: 4px;
  font-size: 13px;
  line-height: 1.6;
}

.derived-row span {
  color: var(--text-muted);
}

.derived-row strong {
  color: var(--derived-text);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-weight: 700;
}

.apply-btn {
  width: 100%;
  height: 36px;
  background: var(--accent);
  color: #2A2418;
  border: 1px solid #9F7625;
  border-radius: 6px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
}

.apply-btn:hover {
  background: var(--accent-hover);
}
</style>
