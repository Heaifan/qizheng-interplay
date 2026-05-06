import { type Ref, ref } from 'vue';
import { useGameStore } from '@/stores/gameStore';

export function useCanvasTouch(
  canvasRef: Ref<HTMLCanvasElement | null>,
  planningArmed: Ref<boolean>,
  drawing: Ref<boolean>,
) {
  const game = useGameStore();
  let lastTapMs = 0;
  let lastTapPos: { x: number; y: number } | null = null;

  function onTouchStart(ev: TouchEvent) {
    const canvas = canvasRef.value;
    if (!canvas) return;
    const touch = ev.touches[0];
    if (!touch) return;
    const pos = {
      x: touch.clientX - canvas.getBoundingClientRect().left,
      y: touch.clientY - canvas.getBoundingClientRect().top,
    };
    const now = Date.now();
    const isDoubleTap =
      lastTapPos &&
      now - lastTapMs < 320 &&
      Math.hypot(pos.x - lastTapPos.x, pos.y - lastTapPos.y) < 26;

    if (isDoubleTap) {
      planningArmed.value = game.selectPlannerByPoint(pos);
      ev.preventDefault();
    } else if (planningArmed.value) {
      drawing.value = true;
      planningArmed.value = false;
      game.beginPathAt(pos);
      ev.preventDefault();
    }
    lastTapMs = now;
    lastTapPos = pos;
  }

  function onTouchMove(ev: TouchEvent) {
    if (!drawing.value) return;
    const canvas = canvasRef.value;
    if (!canvas) return;
    const touch = ev.touches[0];
    if (!touch) return;
    game.extendPathIfFarEnough({
      x: touch.clientX - canvas.getBoundingClientRect().left,
      y: touch.clientY - canvas.getBoundingClientRect().top,
    });
    ev.preventDefault();
  }

  function onTouchEnd() {
    if (drawing.value) game.finalizePathDrawing();
    drawing.value = false;
  }

  return { onTouchStart, onTouchMove, onTouchEnd };
}
