<script setup lang="ts">
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@/domain/constants';
import { renderTacticalScene } from '@/rendering/tacticalCanvasRenderer';
import { useGameStore } from '@/stores/gameStore';
import { storeToRefs } from 'pinia';
import { computed, onMounted, onUnmounted, ref, toValue, useTemplateRef } from 'vue';

const game = useGameStore();
const { mode } = storeToRefs(game);
const canvasRef = useTemplateRef('canvas');
const planningArmed = ref(false);
const canvasCursor = computed(() => (planningArmed.value || drawing ? 'pointer' : 'default'));

let raf = 0;
let debugLoopLogSent = false;

function canvasPointFromEvent(ev: MouseEvent, canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  const rawX = ev.clientX - rect.left;
  const rawY = ev.clientY - rect.top;
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const pos = { x: rawX * scaleX, y: rawY * scaleY };
  // #region agent log
  fetch('http://127.0.0.1:7525/ingest/a523c2c6-b217-4642-94e6-5b99fe0996b8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dc1890'},body:JSON.stringify({sessionId:'dc1890',runId:'repro8',hypothesisId:'H1',location:'src/components/TacticalMapCanvas.vue:canvasPointFromEvent',message:'mouse mapped to canvas space',data:{clientX:ev.clientX,clientY:ev.clientY,rawX,rawY,scaleX,scaleY,mapped:pos,rectW:rect.width,rectH:rect.height,canvasW:canvas.width,canvasH:canvas.height},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  return pos;
}

function loop(ts: number) {
  const canvas = canvasRef.value;
  const ctx = canvas?.getContext('2d');
  if (!debugLoopLogSent) {
    debugLoopLogSent = true;
    // #region agent log
    fetch('http://127.0.0.1:7525/ingest/a523c2c6-b217-4642-94e6-5b99fe0996b8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dc1890'},body:JSON.stringify({sessionId:'dc1890',runId:'repro4',hypothesisId:'H3',location:'src/components/TacticalMapCanvas.vue:loop',message:'first loop state',data:{hasCanvas:!!canvas,hasCtx:!!ctx,canvasWidth:canvas?.width,canvasHeight:canvas?.height},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }
  game.tick(ts);
  if (ctx) {
    renderTacticalScene(ctx, { ...toValue(game.renderSnapshot), showPathArrow: !drawing });
  }
  raf = requestAnimationFrame(loop);
}

let drawing = false;

function onDown(ev: MouseEvent) {
  const canvas = canvasRef.value;
  if (!canvas) return;
  // #region agent log
  fetch('http://127.0.0.1:7525/ingest/a523c2c6-b217-4642-94e6-5b99fe0996b8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dc1890'},body:JSON.stringify({sessionId:'dc1890',runId:'repro8',hypothesisId:'H3',location:'src/components/TacticalMapCanvas.vue:onDown',message:'mousedown gate check',data:{button:ev.button,planningArmed:planningArmed.value,mode:mode.value,drawingBefore:drawing},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  if (ev.button !== 0) return;
  if (!planningArmed.value) return;
  drawing = true;
  planningArmed.value = false;
  game.beginPathAt(canvasPointFromEvent(ev, canvas));
}

function onContextMenu(ev: MouseEvent) {
  const canvas = canvasRef.value;
  if (!canvas) return;
  ev.preventDefault();
  const pos = canvasPointFromEvent(ev, canvas);
  // #region agent log
  fetch('http://127.0.0.1:7525/ingest/a523c2c6-b217-4642-94e6-5b99fe0996b8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dc1890'},body:JSON.stringify({sessionId:'dc1890',runId:'repro5',hypothesisId:'H1',location:'src/components/TacticalMapCanvas.vue:onContextMenu',message:'context menu event',data:{mode:mode.value,pos,beforePlanningArmed:planningArmed.value},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  planningArmed.value = game.selectPlannerByPoint(pos);
  // #region agent log
  fetch('http://127.0.0.1:7525/ingest/a523c2c6-b217-4642-94e6-5b99fe0996b8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dc1890'},body:JSON.stringify({sessionId:'dc1890',runId:'repro8',hypothesisId:'H2',location:'src/components/TacticalMapCanvas.vue:onContextMenu',message:'context menu handled',data:{afterPlanningArmed:planningArmed.value},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
}

function onDoubleClick(ev: MouseEvent) {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const pos = canvasPointFromEvent(ev, canvas);
  // #region agent log
  fetch('http://127.0.0.1:7525/ingest/a523c2c6-b217-4642-94e6-5b99fe0996b8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dc1890'},body:JSON.stringify({sessionId:'dc1890',runId:'repro5',hypothesisId:'H2',location:'src/components/TacticalMapCanvas.vue:onDoubleClick',message:'double click event',data:{mode:mode.value,pos,beforePlanningArmed:planningArmed.value},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  planningArmed.value = game.selectPlannerByPoint(pos);
  // #region agent log
  fetch('http://127.0.0.1:7525/ingest/a523c2c6-b217-4642-94e6-5b99fe0996b8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dc1890'},body:JSON.stringify({sessionId:'dc1890',runId:'repro8',hypothesisId:'H2',location:'src/components/TacticalMapCanvas.vue:onDoubleClick',message:'double click handled',data:{afterPlanningArmed:planningArmed.value},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
}

function onMove(ev: MouseEvent) {
  if (!drawing) return;
  const canvas = canvasRef.value;
  if (!canvas) return;
  game.extendPathIfFarEnough(canvasPointFromEvent(ev, canvas));
}

function onUp() {
  if (drawing) {
    const snapshot = toValue(game.renderSnapshot);
    // #region agent log
    fetch('http://127.0.0.1:7525/ingest/a523c2c6-b217-4642-94e6-5b99fe0996b8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dc1890'},body:JSON.stringify({sessionId:'dc1890',runId:'repro15',hypothesisId:'H2',location:'src/components/TacticalMapCanvas.vue:onUp',message:'path draw finished',data:{mode:mode.value,pathLens:snapshot.units.map(u=>({id:u.id,pathLen:u.path.length,currentPathIdx:u.currentPathIdx}))},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    game.finalizePathDrawing();
  }
  drawing = false;
}

let lastTapMs = 0;
let lastTapPos: { x: number; y: number } | null = null;

function onTouchStart(ev: TouchEvent) {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const touch = ev.touches[0];
  if (!touch) return;
  const pos = { x: touch.clientX - canvas.getBoundingClientRect().left, y: touch.clientY - canvas.getBoundingClientRect().top };
  const now = Date.now();

  const isDoubleTap =
    lastTapPos &&
    now - lastTapMs < 320 &&
    Math.hypot(pos.x - lastTapPos.x, pos.y - lastTapPos.y) < 26;

  if (isDoubleTap) {
    planningArmed.value = game.selectPlannerByPoint(pos);
    ev.preventDefault();
  } else if (planningArmed.value) {
    drawing = true;
    planningArmed.value = false;
    game.beginPathAt(pos);
    ev.preventDefault();
  }

  lastTapMs = now;
  lastTapPos = pos;
}

function onTouchMove(ev: TouchEvent) {
  if (!drawing) return;
  const canvas = canvasRef.value;
  if (!canvas) return;
  const touch = ev.touches[0];
  if (!touch) return;
  const pos = { x: touch.clientX - canvas.getBoundingClientRect().left, y: touch.clientY - canvas.getBoundingClientRect().top };
  game.extendPathIfFarEnough(pos);
  ev.preventDefault();
}

function onTouchEnd() {
  if (drawing) game.finalizePathDrawing();
  drawing = false;
}

onMounted(() => {
  raf = requestAnimationFrame(loop);
  const canvas = canvasRef.value;
  // #region agent log
  fetch('http://127.0.0.1:7525/ingest/a523c2c6-b217-4642-94e6-5b99fe0996b8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dc1890'},body:JSON.stringify({sessionId:'dc1890',runId:'repro4',hypothesisId:'H1',location:'src/components/TacticalMapCanvas.vue:onMounted',message:'canvas mount snapshot',data:{hasCanvas:!!canvas,canvasWidth:canvas?.width,canvasHeight:canvas?.height,rect:canvas?canvas.getBoundingClientRect():null},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  if (canvas) {
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);
  }
});

onUnmounted(() => {
  cancelAnimationFrame(raf);
  window.removeEventListener('mousemove', onMove);
  window.removeEventListener('mouseup', onUp);
  const canvas = canvasRef.value;
  if (canvas) {
    canvas.removeEventListener('touchstart', onTouchStart);
    canvas.removeEventListener('touchmove', onTouchMove);
    canvas.removeEventListener('touchend', onTouchEnd);
  }
});
</script>

<template>
  <div class="tactical-canvas-shell">
    <canvas
      ref="canvas"
      class="tactical-map"
      :style="{ cursor: canvasCursor }"
      :width="CANVAS_WIDTH"
      :height="CANVAS_HEIGHT"
      @mousedown="onDown"
      @contextmenu="onContextMenu"
      @dblclick="onDoubleClick"
    />
  </div>
</template>
