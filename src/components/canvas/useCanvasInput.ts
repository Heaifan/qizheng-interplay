import { type Ref, ref, computed } from 'vue';
import { useGameStore } from '@/stores/gameStore';
import { screenToWorld, zoomAtScreenPoint } from '@/domain/camera';

export function useCanvasInput(canvasRef: Ref<HTMLCanvasElement | null>) {
  const game = useGameStore();
  const planningArmed = ref(false);
  const drawing = ref(false);
  const canvasCursor = computed(() =>
    planningArmed.value || drawing.value ? 'pointer' : 'default',
  );

  function worldPoint(ev: MouseEvent) {
    const canvas = canvasRef.value;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const sx = (ev.clientX - rect.left) * scaleX;
    const sy = (ev.clientY - rect.top) * scaleY;
    return screenToWorld(sx, sy, game.camera);
  }

  function onDown(ev: MouseEvent) {
    const canvas = canvasRef.value;
    if (!canvas) return;
    if (ev.button !== 0 || !planningArmed.value) return;
    drawing.value = true;
    planningArmed.value = false;
    game.beginPathAt(worldPoint(ev));
  }

  function onContextMenu(ev: MouseEvent) {
    const canvas = canvasRef.value;
    if (!canvas) return;
    ev.preventDefault();
    planningArmed.value = game.selectPlannerByPoint(worldPoint(ev));
  }

  function onDoubleClick(ev: MouseEvent) {
    const canvas = canvasRef.value;
    if (!canvas) return;
    planningArmed.value = game.selectPlannerByPoint(worldPoint(ev));
  }

  function onMove(ev: MouseEvent) {
    if (!drawing.value) return;
    game.extendPathIfFarEnough(worldPoint(ev));
  }

  function onUp() {
    if (drawing.value) game.finalizePathDrawing();
    drawing.value = false;
  }

  function onWheel(ev: WheelEvent): void {
    const canvas = canvasRef.value;
    if (!canvas) return;
    ev.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const sx = (ev.clientX - rect.left) * scaleX;
    const sy = (ev.clientY - rect.top) * scaleY;
    const direction = ev.deltaY < 0 ? 1 : -1;
    const nextZoom = direction > 0 ? game.camera.zoom * 1.1 : game.camera.zoom / 1.1;
    const next = zoomAtScreenPoint(game.camera, sx, sy, nextZoom);
    Object.assign(game.camera, next);
  }

  return {
    planningArmed, drawing, canvasCursor,
    onDown, onContextMenu, onDoubleClick, onMove, onUp, onWheel,
  };
}
