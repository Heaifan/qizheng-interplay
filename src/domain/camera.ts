export interface CameraState {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 4.0;
export const DEFAULT_ZOOM = 1.0;
export const ZOOM_STEP = 1.1;

export function clampZoom(zoom: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
}

export function worldToScreen(
  wx: number, wy: number, cam: CameraState,
): { x: number; y: number } {
  return {
    x: wx * cam.zoom + cam.offsetX,
    y: wy * cam.zoom + cam.offsetY,
  };
}

export function screenToWorld(
  sx: number, sy: number, cam: CameraState,
): { x: number; y: number } {
  return {
    x: (sx - cam.offsetX) / cam.zoom,
    y: (sy - cam.offsetY) / cam.zoom,
  };
}

/** 以屏幕某点为中心缩放，保持该点对应的世界坐标不变 */
export function zoomAtScreenPoint(
  cam: CameraState,
  screenX: number,
  screenY: number,
  nextZoom: number,
): CameraState {
  const clamped = clampZoom(nextZoom);
  const world = screenToWorld(screenX, screenY, cam);
  return {
    zoom: clamped,
    offsetX: screenX - world.x * clamped,
    offsetY: screenY - world.y * clamped,
  };
}
