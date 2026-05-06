import { type Ref, ref, computed } from 'vue';
import { useGameStore } from '@/stores/gameStore';

export function useCanvasInput(canvasRef: Ref<HTMLCanvasElement | null>) {
  const game = useGameStore();
  const planningArmed = ref(false);
  const drawing = ref(false);
  const canvasCursor = computed(() =>
    planningArmed.value || drawing.value ? 'pointer' : 'default',
  );

  function canvasPoint(ev: MouseEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (ev.clientX - rect.left) * scaleX,
      y: (ev.clientY - rect.top) * scaleY,
    };
  }

  function onDown(ev: MouseEvent) {
    const canvas = canvasRef.value;
    if (!canvas) return;
    if (ev.button !== 0 || !planningArmed.value) return;
    drawing.value = true;
    planningArmed.value = false;
    game.beginPathAt(canvasPoint(ev, canvas));
  }

  function onContextMenu(ev: MouseEvent) {
    const canvas = canvasRef.value;
    if (!canvas) return;
    ev.preventDefault();
    planningArmed.value = game.selectPlannerByPoint(canvasPoint(ev, canvas));
  }

  function onDoubleClick(ev: MouseEvent) {
    const canvas = canvasRef.value;
    if (!canvas) return;
    planningArmed.value = game.selectPlannerByPoint(canvasPoint(ev, canvas));
  }

  function onMove(ev: MouseEvent) {
    if (!drawing.value) return;
    const canvas = canvasRef.value;
    if (!canvas) return;
    game.extendPathIfFarEnough(canvasPoint(ev, canvas));
  }

  function onUp() {
    if (drawing.value) game.finalizePathDrawing();
    drawing.value = false;
  }

  return {
    planningArmed, drawing, canvasCursor,
    onDown, onContextMenu, onDoubleClick, onMove, onUp,
  };
}
