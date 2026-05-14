import { type Ref, ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useGameStore } from '@/stores/gameStore';
import { screenToWorld, zoomAtScreenPoint, MIN_ZOOM, MAX_ZOOM } from '@/domain/camera';
import type { RulerPoint } from '@/game/ruler';

const pointers = new Map<number, { sx: number; sy: number }>();
let spaceHeld = false;
let panStart: { sx: number; sy: number; ox: number; oy: number } | null = null;
let clickStartPos: { sx: number; sy: number } | null = null;

const DRAG_THRESHOLD = 4;

export function useCanvasInput(canvasRef: Ref<HTMLCanvasElement | null>) {
  const game = useGameStore();

  // RAF throttling for ruler pointer updates
  let pendingRulerEnd: RulerPoint | null = null;
  let rulerRafId = 0;
  function scheduleRulerEnd(point: RulerPoint) {
    pendingRulerEnd = point;
    if (rulerRafId) return;
    rulerRafId = requestAnimationFrame(() => {
      if (pendingRulerEnd) game.ruler.end = pendingRulerEnd;
      pendingRulerEnd = null;
      rulerRafId = 0;
    });
  }
  const planningArmed = ref(false);
  const drawing = ref(false);
  const canvasCursor = computed(() =>
    planningArmed.value || drawing.value ? 'pointer' : 'default',
  );

  function screenPoint(ev: { clientX: number; clientY: number }) {
    const canvas = canvasRef.value;
    if (!canvas) return { sx: 0, sy: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      sx: (ev.clientX - rect.left) * scaleX,
      sy: (ev.clientY - rect.top) * scaleY,
    };
  }

  function worldPoint(ev: { clientX: number; clientY: number }) {
    const { sx, sy } = screenPoint(ev);
    return screenToWorld(sx, sy, game.camera);
  }

  // ---- pan ----
  function startPan(sx: number, sy: number) {
    panStart = { sx, sy, ox: game.camera.offsetX, oy: game.camera.offsetY };
  }

  function continuePan(sx: number, sy: number) {
    if (!panStart) return;
    game.camera.offsetX = panStart.ox + (sx - panStart.sx);
    game.camera.offsetY = panStart.oy + (sy - panStart.sy);
  }

  function endPan() { panStart = null; }

  function isDragFar(sx: number, sy: number): boolean {
    if (!clickStartPos) return true;
    return Math.hypot(sx - clickStartPos.sx, sy - clickStartPos.sy) > DRAG_THRESHOLD;
  }

  // ---- pointer events ----
  function onPointerDown(ev: PointerEvent) {
    const canvas = canvasRef.value;
    if (!canvas) return;
    canvas.setPointerCapture(ev.pointerId);
    const sp = screenPoint(ev);
    pointers.set(ev.pointerId, { sx: sp.sx, sy: sp.sy });
    clickStartPos = { sx: sp.sx, sy: sp.sy };

    // Alt+left → ruler (shortcut)
    if (ev.altKey && ev.button === 0) {
      ev.preventDefault();
      const wp = worldPoint(ev);
      game.ruler = { active: true, visible: true, start: wp, end: wp };
      return;
    }

    // measure mode: left button → ruler
    if (game.interactionMode === 'measure' && ev.button === 0) {
      ev.preventDefault();
      const wp = worldPoint(ev);
      game.ruler = { active: true, visible: true, start: wp, end: wp };
      return;
    }

    // middle button → always pan
    if (ev.button === 1) {
      ev.preventDefault();
      startPan(sp.sx, sp.sy);
      return;
    }

    // space + left → pan
    if (ev.button === 0 && spaceHeld) {
      ev.preventDefault();
      startPan(sp.sx, sp.sy);
      return;
    }

    // right click → context menu
    if (ev.button === 2) {
      ev.preventDefault();
      planningArmed.value = game.selectPlannerByPoint(worldPoint(ev));
      return;
    }

    // left click
    if (ev.button === 0) {
      if (game.interactionMode === 'planPath') {
        // planPath: delay path start until drag exceeds threshold.
        // This prevents accidental clicks from resetting the path
        // or switching the active planner to an enemy unit.
        ev.preventDefault();
      } else {
        // browse mode: check if planningArmed (from right-click context)
        if (planningArmed.value) {
          drawing.value = true;
          planningArmed.value = false;
          game.beginPathAt(worldPoint(ev));
          ev.preventDefault();
        }
      }
    }
  }

  function onPointerMove(ev: PointerEvent) {
    const sp = screenPoint(ev);
    const existing = pointers.get(ev.pointerId);
    if (existing) {
      existing.sx = sp.sx;
      existing.sy = sp.sy;
    }

    // pinch zoom (2+ pointers)
    if (pointers.size >= 2) return;

    // pan in progress
    if (panStart) {
      continuePan(sp.sx, sp.sy);
      return;
    }

    // ruler drag (RAF-throttled)
    if (game.ruler.active && pointers.size === 1) {
      const wp = worldPoint(ev);
      scheduleRulerEnd(wp);
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

    // drawing
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

    // planPath mode: finalize drawing but never select planner
    if (game.interactionMode === 'planPath') {
      if (drawing.value) {
        game.finalizePathDrawing();
        drawing.value = false;
      }
      clickStartPos = null;
      return;
    }

    // browse mode: left click without drag → select unit
    if (ev.button === 0 && clickStartPos && !isDragFar(screenPoint(ev).sx, screenPoint(ev).sy)) {
      const wp = worldPoint(ev);
      const hit = game.selectPlannerByPoint(wp);
      planningArmed.value = hit;
    }

    if (drawing.value) {
      game.finalizePathDrawing();
      drawing.value = false;
    }

    clickStartPos = null;
  }

  function onPointerCancel(ev: PointerEvent) {
    pointers.delete(ev.pointerId);
    if (panStart) endPan();
    if (drawing.value) { drawing.value = false; }
    clickStartPos = null;
  }

  // ---- wheel ----
  function onWheel(ev: WheelEvent): void {
    const canvas = canvasRef.value;
    if (!canvas) return;
    ev.preventDefault();
    const sp = screenPoint(ev);
    const direction = ev.deltaY < 0 ? 1 : -1;
    const nextZoom = direction > 0
      ? Math.min(MAX_ZOOM, game.camera.zoom * 1.1)
      : Math.max(MIN_ZOOM, game.camera.zoom / 1.1);
    const next = zoomAtScreenPoint(game.camera, sp.sx, sp.sy, nextZoom);
    Object.assign(game.camera, next);
  }

  // ---- space key tracking ----
  function onKeyDown(ev: KeyboardEvent) {
    if (ev.code === 'Space') {
      spaceHeld = true;
      ev.preventDefault();
    }
    if (ev.key === 'Escape') {
      game.ruler.active = false;
      game.ruler.visible = false;
      game.ruler.start = null;
      game.ruler.end = null;
    }
  }

  function onKeyUp(ev: KeyboardEvent) {
    if (ev.code === 'Space') {
      spaceHeld = false;
      if (panStart) endPan();
    }
  }

  // Clean up planning/drawing state when switching away from planPath or browse
  watch(() => game.interactionMode, (mode) => {
    if (mode !== 'planPath') {
      drawing.value = false;
      planningArmed.value = false;
    }
  });

  onMounted(() => {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    if (rulerRafId) cancelAnimationFrame(rulerRafId);
  });

  return {
    planningArmed, drawing, canvasCursor,
    onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onWheel,
    onContextMenu: (ev: MouseEvent) => {
      ev.preventDefault();
      planningArmed.value = game.selectPlannerByPoint(worldPoint(ev));
    },
    onDoubleClick: (ev: MouseEvent) => {
      planningArmed.value = game.selectPlannerByPoint(worldPoint(ev));
    },
  };
}
