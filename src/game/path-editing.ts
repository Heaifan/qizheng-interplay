import type { Ref } from 'vue';
import { PATH_SAMPLE_MIN_DIST } from '@/domain/constants';
import type { GameMode, LogEntry, Point, RuntimeUnit } from '@/domain/types';

export function clonePath(path: Point[]): Point[] {
  return path.map((p) => ({ ...p }));
}

export function smoothPathPoints(points: Point[]): Point[] {
  if (points.length < 4) return points;
  const smoothed: Point[] = [points[0]!];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]!;
    const curr = points[i]!;
    const next = points[i + 1]!;
    smoothed.push({
      x: prev.x * 0.2 + curr.x * 0.6 + next.x * 0.2,
      y: prev.y * 0.2 + curr.y * 0.6 + next.y * 0.2,
    });
  }
  smoothed.push(points[points.length - 1]!);
  return smoothed;
}

export interface PathEditDeps {
  units: Ref<RuntimeUnit[]>;
  mode: Ref<GameMode>;
  activePlannerIdx: Ref<0 | 1 | null>;
  pathUndoStacks: Ref<Point[][][]>;
  pathRedoStacks: Ref<Point[][][]>;
  addLog: (unitId: string, text: string, tone: LogEntry['tone']) => void;
}

export function createPathEditActions(d: PathEditDeps) {
  function pushPathUndo(idx: number): void {
    d.pathUndoStacks.value[idx]!.push(clonePath(d.units.value[idx]!.path));
    if (d.pathUndoStacks.value[idx]!.length > 80) d.pathUndoStacks.value[idx]!.shift();
  }

  function beginPathAt(pos: Point): void {
    if (d.activePlannerIdx.value === null) return;
    const idx = d.activePlannerIdx.value;
    pushPathUndo(idx);
    d.pathRedoStacks.value[idx] = [];
    const u = d.units.value[idx]!;
    u.path = [{ x: u.x, y: u.y }, pos];
    u.currentPathIdx = 0;
  }

  function extendPathIfFarEnough(pos: Point): void {
    if (d.activePlannerIdx.value === null) return;
    const idx = d.activePlannerIdx.value;
    const u = d.units.value[idx]!;
    const last = u.path[u.path.length - 1];
    if (!last) return;
    if (Math.hypot(pos.x - last.x, pos.y - last.y) > PATH_SAMPLE_MIN_DIST) {
      u.path.push(pos);
    }
  }

  function finalizePathDrawing(): void {
    if (d.activePlannerIdx.value === null) return;
    const idx = d.activePlannerIdx.value;
    const u = d.units.value[idx]!;
    if (u.path.length < 4) return;
    u.path = smoothPathPoints(u.path);
  }

  function undoPathEdit(): void {
    if (d.activePlannerIdx.value === null) return;
    const idx = d.activePlannerIdx.value;
    const prev = d.pathUndoStacks.value[idx]!.pop();
    if (!prev) return;
    d.pathRedoStacks.value[idx]!.push(clonePath(d.units.value[idx]!.path));
    d.units.value[idx]!.path = clonePath(prev);
    d.units.value[idx]!.currentPathIdx = Math.min(
      d.units.value[idx]!.currentPathIdx,
      Math.max(0, prev.length - 1),
    );
    d.addLog('系统', `已撤销 ${d.units.value[idx]!.id} 路线编辑`, 'log-miss');
  }

  function redoPathEdit(): void {
    if (d.activePlannerIdx.value === null) return;
    const idx = d.activePlannerIdx.value;
    const next = d.pathRedoStacks.value[idx]!.pop();
    if (!next) return;
    d.pathUndoStacks.value[idx]!.push(clonePath(d.units.value[idx]!.path));
    d.units.value[idx]!.path = clonePath(next);
    d.units.value[idx]!.currentPathIdx = Math.min(
      d.units.value[idx]!.currentPathIdx,
      Math.max(0, next.length - 1),
    );
    d.addLog('系统', `已重做 ${d.units.value[idx]!.id} 路线编辑`, 'log-miss');
  }

  return {
    pushPathUndo,
    beginPathAt,
    extendPathIfFarEnough,
    finalizePathDrawing,
    undoPathEdit,
    redoPathEdit,
  };
}
