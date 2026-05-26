<script setup lang="ts">
import BattleLogPanel from '@/components/BattleLogPanel.vue';
import GameToolbar from '@/components/GameToolbar.vue';
import TacticalMapCanvas from '@/components/TacticalMapCanvas.vue';
const appVersion = __APP_VERSION__;
</script>

<template>
  <div class="tactical-app">
    <header class="tactical-header">
      <h2>奇正相生-战斗模拟器 <span class="version">v{{ appVersion }}</span></h2>
      <p>右键点击单位进入规划，再按住左键拖动绘制路径，点击执行后单位将自主交火！</p>
    </header>
    <div class="tactical-layout">
      <div class="battlefield-column">
        <TacticalMapCanvas />
        <GameToolbar />
      </div>
      <BattleLogPanel />
    </div>
  </div>
</template>
