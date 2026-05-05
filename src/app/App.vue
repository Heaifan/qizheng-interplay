<script setup lang="ts">
import BattleLogPanel from '@/components/BattleLogPanel.vue';
import GameToolbar from '@/components/GameToolbar.vue';
import TacticalMapCanvas from '@/components/TacticalMapCanvas.vue';
import { onMounted } from 'vue';

onMounted(() => {
  const layout = document.querySelector('.tactical-layout') as HTMLElement | null;
  const app = document.querySelector('.tactical-app') as HTMLElement | null;
  const battleCol = document.querySelector('.battlefield-column') as HTMLElement | null;
  const map = document.querySelector('.tactical-map') as HTMLElement | null;
  const editBar = document.querySelector('.path-edit-toolbar') as HTMLElement | null;
  const playerBar = document.querySelector('.player-bar') as HTMLElement | null;
  // #region agent log
  fetch('http://127.0.0.1:7525/ingest/a523c2c6-b217-4642-94e6-5b99fe0996b8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dc1890'},body:JSON.stringify({sessionId:'dc1890',runId:'repro17',hypothesisId:'H1',location:'src/app/App.vue:onMounted',message:'layout squeeze baseline',data:{viewport:{w:window.innerWidth,h:window.innerHeight},appRect:app?.getBoundingClientRect(),layoutRect:layout?.getBoundingClientRect(),battleColRect:battleCol?.getBoundingClientRect(),mapRect:map?.getBoundingClientRect(),editBarRect:editBar?.getBoundingClientRect(),playerBarRect:playerBar?.getBoundingClientRect()},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
});
</script>

<template>
  <div class="tactical-app">
    <header class="tactical-header">
      <h2>奇正相生-战斗模拟器</h2>
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
