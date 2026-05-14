<script setup lang="ts">
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@/domain/constants';
import { onMounted, onUnmounted, useTemplateRef } from 'vue';
import { useCanvasInput } from './canvas/useCanvasInput';
import { useAnimationLoop } from './canvas/useAnimationLoop';

const canvasRef = useTemplateRef('canvas');
const input = useCanvasInput(canvasRef);
const {
  canvasCursor, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onWheel,
  onContextMenu, onDoubleClick,
} = input;
const anim = useAnimationLoop(canvasRef, input.drawing);

onMounted(() => {
  anim.start();
  const canvas = canvasRef.value;
  if (canvas) {
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerCancel);
    canvas.addEventListener('wheel', onWheel, { passive: false });
  }
});

onUnmounted(() => {
  anim.stop();
  const canvas = canvasRef.value;
  if (canvas) {
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointercancel', onPointerCancel);
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
      @contextmenu="onContextMenu"
      @dblclick="onDoubleClick"
    />
  </div>
</template>
