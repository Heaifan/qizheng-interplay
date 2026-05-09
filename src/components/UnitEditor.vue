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
    <!-- 单位选择 -->
    <div class="editor-section">
      <label class="section-label">单位选择</label>
      <div class="unit-toggle">
        <button
          :class="['toggle-btn', { active: selectedIdx === 0 }]"
          @click="selectedIdx = 0"
        >
          蓝方
        </button>
        <button
          :class="['toggle-btn', { active: selectedIdx === 1 }]"
          @click="selectedIdx = 1"
        >
          红方
        </button>
      </div>
      <div class="profile-label">{{ editing.name }}</div>
    </div>

    <!-- 基本信息 -->
    <div class="editor-section">
      <label class="section-label">名称</label>
      <input v-model="editing.name" type="text" class="field-input" />
    </div>

    <!-- 三状态 -->
    <div class="editor-section">
      <label class="section-label">三状态</label>
      <div class="field-row">
        <span>体能</span>
        <input v-model.number="editing.states.stamina" type="number" min="0" max="100" class="field-num" />
      </div>
      <div class="field-row">
        <span>士气</span>
        <input v-model.number="editing.states.morale" type="number" min="0" max="100" class="field-num" />
      </div>
      <div class="field-row">
        <span>专注</span>
        <input v-model.number="editing.states.focus" type="number" min="0" max="100" class="field-num" />
      </div>
    </div>

    <!-- 六力 -->
    <div class="editor-section">
      <label class="section-label">六力</label>
      <div class="field-row">
        <span>打击力</span>
        <input v-model.number="editing.forces.strike" type="number" min="0" max="100" class="field-num" />
      </div>
      <div class="field-row">
        <span>生存力</span>
        <input v-model.number="editing.forces.survival" type="number" min="0" max="100" class="field-num" />
      </div>
      <div class="field-row">
        <span>机动力</span>
        <input v-model.number="editing.forces.mobility" type="number" min="0" max="100" class="field-num" />
      </div>
      <div class="field-row">
        <span>感知力</span>
        <input v-model.number="editing.forces.perception" type="number" min="0" max="100" class="field-num" />
      </div>
      <div class="field-row">
        <span>控制力</span>
        <input v-model.number="editing.forces.control" type="number" min="0" max="100" class="field-num" />
      </div>
      <div class="field-row">
        <span>保障力</span>
        <input v-model.number="editing.forces.sustainment" type="number" min="0" max="100" class="field-num" />
      </div>
    </div>

    <!-- 武器参数 -->
    <div class="editor-section">
      <label class="section-label">武器参数</label>
      <div class="field-row">
        <span>名称</span>
        <input v-model="editing.weapon.name" type="text" class="field-input" style="flex:1" />
      </div>
      <div class="field-row">
        <span>口径 (mm)</span>
        <input v-model.number="editing.weapon.caliber" type="number" min="0" step="0.01" class="field-num" />
      </div>
      <div class="field-row">
        <span>枪机</span>
        <select v-model="editing.weapon.action" class="field-select">
          <option v-for="o in actionOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </div>
      <div class="field-row">
        <span>枪管长 (mm)</span>
        <input v-model.number="editing.weapon.barrelLength" type="number" min="0" class="field-num" />
      </div>
      <div class="field-row">
        <span>瞄具倍率</span>
        <input v-model.number="editing.weapon.sightMag" type="number" min="0" step="0.1" class="field-num" />
      </div>
    </div>

    <!-- 武器推导结果 -->
    <div class="editor-section derived">
      <label class="section-label">武器推导结果</label>
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

    <!-- Apply -->
    <button class="apply-btn" @click="apply">应用</button>
  </div>
</template>

<style scoped>
.unit-editor {
  flex: 1;
  padding: 8px 10px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.editor-section {
  background: #37474f;
  border-radius: 4px;
  padding: 6px 8px;
}

.section-label {
  display: block;
  font-size: 11px;
  color: #ffb74d;
  font-weight: bold;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.unit-toggle {
  display: flex;
  gap: 4px;
  margin-bottom: 4px;
}

.toggle-btn {
  flex: 1;
  padding: 4px 0;
  border: 1px solid #546e7a;
  background: #263238;
  color: #90a4ae;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
}

.toggle-btn.active {
  border-color: #ffb74d;
  color: #ffb74d;
  background: #37474f;
}

.profile-label {
  font-size: 11px;
  color: #81c784;
  text-align: center;
}

.field-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
  font-size: 12px;
}

.field-row span {
  color: #b0bec5;
  flex: 0 0 70px;
}

.field-num {
  width: 70px;
  padding: 2px 4px;
  background: #263238;
  border: 1px solid #546e7a;
  color: #eceff1;
  border-radius: 2px;
  font-size: 12px;
  text-align: right;
}

.field-input {
  flex: 1;
  padding: 2px 4px;
  background: #263238;
  border: 1px solid #546e7a;
  color: #eceff1;
  border-radius: 2px;
  font-size: 12px;
}

.field-select {
  width: 140px;
  padding: 2px 4px;
  background: #263238;
  border: 1px solid #546e7a;
  color: #eceff1;
  border-radius: 2px;
  font-size: 12px;
}

.derived {
  background: #1b5e20;
}

.derived-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 2px;
}

.derived-row span {
  color: #a5d6a7;
}

.derived-row strong {
  color: #76ff03;
  font-family: monospace;
}

.apply-btn {
  padding: 8px;
  background: #ffb74d;
  color: #263238;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  font-size: 13px;
  cursor: pointer;
  text-transform: uppercase;
}

.apply-btn:hover {
  background: #ffa726;
}
</style>
