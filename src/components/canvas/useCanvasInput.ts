import { type Ref, ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useGameStore } from '@/stores/gameStore';
import { screenToWorld, zoomAtScreenPoint, MIN_ZOOM, MAX_ZOOM } from '@/domain/camera';
import {
  pointers, spaceHeld, panStart, clickStartPos, DRAG_THRESHOLD,
  setSpaceHeld, setPanStart, setClickStartPos,
  screenPoint, worldPoint,
  startPan, continuePan, endPan, isDragFar,
  scheduleRulerEnd, cancelRulerRaf,
} from './hook_canvasUtils';

export function useCanvasInput(canvasRef: Ref<HTMLCanvasElement | null>) {
  const game = useGameStore();
  const planningArmed = ref(false);
  const drawing = ref(false);
  const canvasCursor = computed(() =>
    planningArmed.value || drawing.value ? 'pointer' : 'default',
  );

  // ---- pointer events ----
  function onPointerDown(ev: PointerEvent) {
    const canvas = canvasRef.value;
    if (!canvas) return;
    canvas.setPointerCapture(ev.pointerId);
    const sp = screenPoint(ev, canvas);
    pointers.set(ev.pointerId, { sx: sp.sx, sy: sp.sy });
    setClickStartPos({ sx: sp.sx, sy: sp.sy });

    // Alt+left → ruler (shortcut)
    if (ev.altKey && ev.button === 0) {
      ev.preventDefault();
      const wp = worldPoint(ev, canvas, game.camera);
      game.ruler = { active: true, visible: true, start: wp, end: wp };
      return;
    }

    // measure mode: left button → ruler
    if (game.interactionMode === 'measure' && ev.button === 0) {
      ev.preventDefault();
      const wp = worldPoint(ev, canvas, game.camera);
      game.ruler = { active: true, visible: true, start: wp, end: wp };
      return;
    }

    // middle button → always pan
    if (ev.button === 1) {
      ev.preventDefault();
      startPan(sp.sx, sp.sy, game.camera);
      return;
    }

    // space + left → pan
    if (ev.button === 0 && spaceHeld) {
      ev.preventDefault();
      startPan(sp.sx, sp.sy, game.camera);
      return;
    }

    // right click → context menu
    if (ev.button === 2) {
      ev.preventDefault();
      planningArmed.value = game.selectPlannerByPoint(worldPoint(ev, canvas, game.camera));
      return;
    }

    // left click
    if (ev.button === 0) {
      if (game.interactionMode === 'planPath') {
        ev.preventDefault();
      } else {
        if (planningArmed.value) {
          drawing.value = true;
          planningArmed.value = false;
          game.beginPathAt(worldPoint(ev, canvas, game.camera));
          ev.preventDefault();
        }
      }
    }
  }

  function onPointerMove(ev: PointerEvent) {
    const canvas = canvasRef.value;
    const sp = screenPoint(ev, canvas);
    const existing = pointers.get(ev.pointerId);
    if (existing) { existing.sx = sp.sx; existing.sy = sp.sy; }

    if (pointers.size >= 2) return;
    if (panStart) { continuePan(sp.sx, sp.sy, game.camera); return; }

    // ruler drag (RAF-throttled)
    if (game.ruler.active && pointers.size === 1) {
      const wp = worldPoint(ev, canvas, game.camera);
      scheduleRulerEnd(wp, game.ruler);
      return;
    }

    // planPath: start drawing once drag exceeds threshold
    if (game.interactionMode === 'planPath' && clickStartPos && !drawing.value) {
      if (isDragFar(sp.sx, sp.sy)) {
        drawing.value = true;
        planningArmed.value = false;
        game.beginPathAt(screenToWorld(sp.sx, sp.sy, game.camera));
      }
      return;
    }

    if (drawing.value) {
      game.extendPathIfFarEnough(screenToWorld(sp.sx, sp.sy, game.camera));
    }
  }

  function onPointerUp(ev: PointerEvent) {
    const canvas = canvasRef.value;
    if (canvas) canvas.releasePointerCapture(ev.pointerId);
    pointers.delete(ev.pointerId);

    if (panStart) { endPan(); return; }
    if (game.ruler.active) { game.ruler.active = false; return; }

    if (game.interactionMode === 'planPath') {
      if (drawing.value) { game.finalizePathDrawing(); drawing.value = false; }
      setClickStartPos(null);
      return;
    }

    // browse mode: left click without drag → select unit
    if (ev.button === 0 && clickStartPos && !isDragFar(screenPoint(ev, canvas).sx, screenPoint(ev, canvas).sy)) {
      game.selectUnitByPoint(worldPoint(ev, canvas, game.camera));
    }

    if (drawing.value) { game.finalizePathDrawing(); drawing.value = false; }
    setClickStartPos(null);
  }

  function onPointerCancel() {
    pointers.clear();
    if (panStart) endPan();
    if (drawing.value) drawing.value = false;
    setClickStartPos(null);
  }

  // ---- wheel ----
  function onWheel(ev: WheelEvent): void {
    const canvas = canvasRef.value;
    if (!canvas) return;
    ev.preventDefault();
    const sp = screenPoint(ev, canvas);
    const direction = ev.deltaY < 0 ? 1 : -1;
    const nextZoom = direction > 0
      ? Math.min(MAX_ZOOM, game.camera.zoom * 1.1)
      : Math.max(MIN_ZOOM, game.camera.zoom / 1.1);
    const next = zoomAtScreenPoint(game.camera, sp.sx, sp.sy, nextZoom);
    Object.assign(game.camera, next);
  }

  // ---- space key tracking ----
  function onKeyDown(ev: KeyboardEvent) {
    if (ev.code === 'Space') { setSpaceHeld(true); ev.preventDefault(); }
    if (ev.key === 'Escape') {
      game.ruler.active = false;
      game.ruler.visible = false;
      game.ruler.start = null;
      game.ruler.end = null;
    }
  }

  function onKeyUp(ev: KeyboardEvent) {
    if (ev.code === 'Space') { setSpaceHeld(false); if (panStart) endPan(); }
  }

  watch(() => game.interactionMode, (mode) => {
    if (mode !== 'planPath') { drawing.value = false; planningArmed.value = false; }
  });

  onMounted(() => {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    cancelRulerRaf();
  });

  return {
    planningArmed, drawing, canvasCursor,
    onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onWheel,
    onContextMenu: (ev: MouseEvent) => {
      const canvas = canvasRef.value;
      ev.preventDefault();
      planningArmed.value = game.selectPlannerByPoint(worldPoint(ev, canvas, game.camera));
    },
    onDoubleClick: (ev: MouseEvent) => {
      const canvas = canvasRef.value;
      ev.preventDefault();
      game.selectUnitByPoint(worldPoint(ev, canvas, game.camera));
    },
  };
}
