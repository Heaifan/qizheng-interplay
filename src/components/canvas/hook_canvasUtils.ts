import { screenToWorld } from '@/domain/camera';
import type { RulerPoint } from '@/game/ruler';

// ---- module-level pointer state ----
export const pointers = new Map<number, { sx: number; sy: number }>();
export let spaceHeld = false;
export let panStart: { sx: number; sy: number; ox: number; oy: number } | null = null;
export let clickStartPos: { sx: number; sy: number } | null = null;
export const DRAG_THRESHOLD = 4;

export function setSpaceHeld(v: boolean) { spaceHeld = v; }
export function setPanStart(s: typeof panStart) { panStart = s; }
export function setClickStartPos(p: typeof clickStartPos) { clickStartPos = p; }

// ---- coordinate conversion ----
export function screenPoint(
  ev: { clientX: number; clientY: number },
  canvas: HTMLCanvasElement | null,
) {
  if (!canvas) return { sx: 0, sy: 0 };
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    sx: (ev.clientX - rect.left) * scaleX,
    sy: (ev.clientY - rect.top) * scaleY,
  };
}

export function worldPoint(
  ev: { clientX: number; clientY: number },
  canvas: HTMLCanvasElement | null,
  camera: { offsetX: number; offsetY: number; zoom: number },
) {
  const { sx, sy } = screenPoint(ev, canvas);
  return screenToWorld(sx, sy, camera);
}

// ---- pan ----
export function startPan(sx: number, sy: number, camera: { offsetX: number; offsetY: number; zoom: number }) {
  panStart = { sx, sy, ox: camera.offsetX, oy: camera.offsetY };
}

export function continuePan(sx: number, sy: number, camera: { offsetX: number; offsetY: number; zoom: number }) {
  if (!panStart) return;
  camera.offsetX = panStart.ox + (sx - panStart.sx);
  camera.offsetY = panStart.oy + (sy - panStart.sy);
}

export function endPan() { panStart = null; }

export function isDragFar(sx: number, sy: number): boolean {
  if (!clickStartPos) return true;
  return Math.hypot(sx - clickStartPos.sx, sy - clickStartPos.sy) > DRAG_THRESHOLD;
}

// ---- RAF-throttled ruler update ----
let pendingRulerEnd: RulerPoint | null = null;
let rulerRafId = 0;

export function scheduleRulerEnd(point: RulerPoint, ruler: { end: RulerPoint | null }) {
  pendingRulerEnd = point;
  if (rulerRafId) return;
  rulerRafId = requestAnimationFrame(() => {
    if (pendingRulerEnd) ruler.end = pendingRulerEnd;
    pendingRulerEnd = null;
    rulerRafId = 0;
  });
}

export function cancelRulerRaf() {
  if (rulerRafId) cancelAnimationFrame(rulerRafId);
}
