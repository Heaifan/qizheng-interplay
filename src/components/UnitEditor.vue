<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useGameStore } from '@/stores/gameStore';
import { deriveWeaponStats } from '@/domain/weapon';
import type { CombatProfile, WeaponAction } from '@/domain/types';

const game = useGameStore();
const { units, uiPanelTab, highlightedUnitId } = storeToRefs(game);

const selectedIdx = ref(0);

function blankProfile(): CombatProfile {
  return {
    id: '', name: '', faction: 'blue',
    states: { stamina: 50, morale: 50, focus: 50 },
    forces: { strike: 50, survival: 50, mobility: 50, perception: 50, control: 50, sustainment: 50 },
    weapon: { id: '', name: '', caliber: 7.62, action: 'bolt', barrelLength: 600, sightMag: 1.0 },
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

watch(uiPanelTab, (tab) => {
  if (tab === 'editor') {
    highlightedUnitId.value = units.value[selectedIdx.value]?.id ?? null;
  } else {
    highlightedUnitId.value = null;
  }
});

const weaponStats = computed(() => deriveWeaponStats(editing.weapon));

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
</script>

<template>
  <div class="unit-editor">
    <!-- 单位选择卡片 -->
    <div class="editor-card">
      <div class="card-title">单位选择</div>
      <div class="unit-toggle">
        <button
          :class="['toggle-btn blue', { active: selectedIdx === 0 }]"
          @click="selectedIdx = 0"
        >
          蓝方
        </button>
        <button
          :class="['toggle-btn red', { active: selectedIdx === 1 }]"
          @click="selectedIdx = 1"
        >
          红方
        </button>
      </div>
      <div class="profile-subtitle">当前：{{ editing.name }}</div>
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

    <!-- 武器参数卡片 -->
    <div class="editor-card">
      <div class="card-title">武器参数</div>
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
    </div>

    <!-- 武器推导结果卡片 -->
    <div class="editor-card derived-card">
      <div class="derived-title">武器推导结果</div>
      <div class="derived-row">
        <span>精度</span>
        <strong>{{ weaponStats.accuracy.toFixed(3) }}</strong>
      </div>
      <div class="derived-row">
        <span>有效射程</span>
        <strong>{{ weaponStats.effectiveRange.toFixed(0) }} m</strong>
      </div>
      <div class="derived-row">
        <span>射击间隔</span>
        <strong>{{ weaponStats.fireIntervalMs.toFixed(0) }} ms</strong>
      </div>
      <div class="derived-row">
        <span>致命性</span>
        <strong>{{ weaponStats.lethality.toFixed(2) }}</strong>
      </div>
      <div class="derived-row">
        <span>射速 (RPM)</span>
        <strong>{{ weaponStats.actionRPM }}</strong>
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

.unit-toggle {
  display: flex;
  gap: 4px;
  margin-bottom: 6px;
}

.toggle-btn {
  flex: 1;
  padding: 6px 0;
  border: 1px solid var(--panel-border);
  background: var(--panel-card-soft);
  color: var(--text-muted);
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
}

.toggle-btn.blue.active {
  background: var(--blue-force);
  color: var(--text-inverse);
  border-color: var(--blue-force);
}

.toggle-btn.red.active {
  background: var(--red-force);
  color: var(--text-inverse);
  border-color: var(--red-force);
}

.profile-subtitle {
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
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

.derived-card {
  background: var(--derived-bg);
  border: 1px solid var(--derived-border);
}

.derived-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--derived-title);
  border-bottom: 1px solid var(--derived-border);
  padding-bottom: 6px;
  margin-bottom: 10px;
  letter-spacing: 0.3px;
}

.derived-row {
  display: grid;
  grid-template-columns: 1fr auto;
  margin-bottom: 5px;
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
