<script setup lang="ts">
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@/domain/constants';
import { onMounted, onUnmounted, useTemplateRef } from 'vue';
import { useCanvasInput } from './canvas/useCanvasInput';
import { useCanvasTouch } from './canvas/useCanvasTouch';
import { useAnimationLoop } from './canvas/useAnimationLoop';

const canvasRef = useTemplateRef('canvas');
const input = useCanvasInput(canvasRef);
const { canvasCursor, onDown, onContextMenu, onDoubleClick, onMove, onUp, onWheel } = input;
const touch = useCanvasTouch(canvasRef, input.planningArmed, input.drawing);
const anim = useAnimationLoop(canvasRef, input.drawing);

onMounted(() => {
  anim.start();
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  const canvas = canvasRef.value;
  if (canvas) {
    canvas.addEventListener('touchstart', touch.onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', touch.onTouchMove, { passive: false });
    canvas.addEventListener('touchend', touch.onTouchEnd);
    canvas.addEventListener('wheel', onWheel, { passive: false });
  }
});

onUnmounted(() => {
  anim.stop();
  window.removeEventListener('mousemove', onMove);
  window.removeEventListener('mouseup', onUp);
  const canvas = canvasRef.value;
  if (canvas) {
    canvas.removeEventListener('touchstart', touch.onTouchStart);
    canvas.removeEventListener('touchmove', touch.onTouchMove);
    canvas.removeEventListener('touchend', touch.onTouchEnd);
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
