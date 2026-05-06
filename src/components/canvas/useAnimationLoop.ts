import { type Ref, toValue } from 'vue';
import { renderTacticalScene } from '@/rendering/tacticalCanvasRenderer';
import { useGameStore } from '@/stores/gameStore';

export function useAnimationLoop(
  canvasRef: Ref<HTMLCanvasElement | null>,
  drawing: Ref<boolean>,
) {
  let raf = 0;
  const game = useGameStore();

  function loop(ts: number) {
    const canvas = canvasRef.value;
    const ctx = canvas?.getContext('2d');
    game.tick(ts);
    if (ctx) {
      renderTacticalScene(ctx, {
        ...toValue(game.renderSnapshot),
        showPathArrow: !drawing.value,
      });
    }
    raf = requestAnimationFrame(loop);
  }

  function start() {
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    cancelAnimationFrame(raf);
  }

  return { start, stop };
}
