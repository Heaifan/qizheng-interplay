import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { PATH_SAMPLE_MIN_DIST, SHOT_ALPHA_DECAY } from '@/domain/constants';
import { BUSHES, COVERS } from '@/domain/terrain';
import type { GameMode, LogEntry, Point, RuntimeUnit, ShotTrail } from '@/domain/types';
import { createRuntimeUnitsFromTemplates, UNIT_TEMPLATES } from '@/domain/units';
import { advanceUnitAlongPath } from '@/game/movement';
import { segmentBlockedByAnyCover, segmentNearAnyBush } from '@/domain/geometry';

function missionTimeLabel(elapsedMs: number): string {
  const sec = Math.max(0, Math.floor(elapsedMs / 1000));
  return `T+${sec}s`;
}

export const useGameStore = defineStore('game', () => {
  type ExecutionState = 'stopped' | 'running' | 'paused';
  type TimelineFrame = {
    units: RuntimeUnit[];
    shots: ShotTrail[];
    logs: LogEntry[];
    mode: GameMode;
    simElapsedMs: number;
  };

  const mode = ref<GameMode>('idle');
  const executionState = ref<ExecutionState>('stopped');
  const activePlannerIdx = ref<0 | 1 | null>(null);
  const units = ref<RuntimeUnit[]>([]);
  const pathUndoStacks = ref<Point[][][]>([[], []]);
  const pathRedoStacks = ref<Point[][][]>([[], []]);
  const shots = ref<ShotTrail[]>([]);
  const logs = ref<LogEntry[]>([]);
  const timeline = ref<TimelineFrame[]>([]);
  const timelineIndex = ref(0);
  const simElapsedMs = ref(0);
  const toolbarHighlight = ref<'blue' | 'red' | 'exec' | null>(null);
  let debugTickCount = 0;
  const SIM_STEP_MS = 1000 / 60;
  const FIRE_COOLDOWN_MS = 550;
  const MAX_RANGE = 900;
  const BASE_HIT_CHANCE = 0.75;
  const renderSnapshot = computed(() => ({
    covers: COVERS,
    bushes: BUSHES,
    units: units.value,
    shots: shots.value,
    mode: mode.value,
    showPlannedPath: mode.value !== 'gameover',
    showPathArrow: true,
  }));
  const canStepBack = computed(() => timelineIndex.value > 0);
  const canStepForward = computed(
    () => timelineIndex.value < timeline.value.length - 1 || mode.value === 'executing',
  );
  const canUndoPathEdit = computed(() => {
    if (activePlannerIdx.value === null) return false;
    return pathUndoStacks.value[activePlannerIdx.value]!.length > 0;
  });
  const canRedoPathEdit = computed(() => {
    if (activePlannerIdx.value === null) return false;
    return pathRedoStacks.value[activePlannerIdx.value]!.length > 0;
  });
  const playbackMin = computed(() => 0);
  const playbackMax = computed(() => Math.max(0, timeline.value.length - 1));

  function addLog(unitId: string, text: string, tone: LogEntry['tone']): void {
    logs.value.push({ timeLabel: missionTimeLabel(simElapsedMs.value), unitId, text, tone });
  }

  function initGame(): void {
    units.value = createRuntimeUnitsFromTemplates(UNIT_TEMPLATES);
    pathUndoStacks.value = [[], []];
    pathRedoStacks.value = [[], []];
    shots.value = [];
    logs.value = [];
    mode.value = 'idle';
    executionState.value = 'stopped';
    activePlannerIdx.value = null;
    simElapsedMs.value = 0;
    timeline.value = [];
    timelineIndex.value = 0;
    toolbarHighlight.value = null;
    addLog('系统', '右键单位后开始绘制路径。', 'log-miss');
    timeline.value.push(cloneFrame());
  }

  function selectPlannerByPoint(pos: Point): boolean {
    if (mode.value === 'gameover') return false;
    if (mode.value === 'executing' && executionState.value === 'running') return false;
    const nearest = units.value
      .map((u, idx) => ({ idx, d: Math.hypot(u.x - pos.x, u.y - pos.y), id: u.id }))
      .sort((a, b) => a.d - b.d)[0];
    // #region agent log
    fetch('http://127.0.0.1:7525/ingest/a523c2c6-b217-4642-94e6-5b99fe0996b8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dc1890'},body:JSON.stringify({sessionId:'dc1890',runId:'repro8',hypothesisId:'H2',location:'src/stores/gameStore.ts:selectPlannerByPoint',message:'planner selection computed',data:{mode:mode.value,pos,nearest},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (!nearest || nearest.d > 30) return false;
    activePlannerIdx.value = nearest.idx as 0 | 1;
    if (mode.value !== 'executing') mode.value = nearest.idx === 0 ? 'planBlue' : 'planRed';
    toolbarHighlight.value = nearest.idx === 0 ? 'blue' : 'red';
    addLog('系统', `已选择${nearest.id}，可开始绘制路径。`, 'log-miss');
    return true;
  }

  function clonePath(path: Point[]): Point[] {
    return path.map((p) => ({ ...p }));
  }

  function pushPathUndo(idx: number): void {
    pathUndoStacks.value[idx]!.push(clonePath(units.value[idx]!.path));
    if (pathUndoStacks.value[idx]!.length > 80) pathUndoStacks.value[idx]!.shift();
  }

  function beginPathAt(pos: Point): void {
    // #region agent log
    fetch('http://127.0.0.1:7525/ingest/a523c2c6-b217-4642-94e6-5b99fe0996b8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dc1890'},body:JSON.stringify({sessionId:'dc1890',runId:'repro8',hypothesisId:'H3',location:'src/stores/gameStore.ts:beginPathAt',message:'begin path called',data:{activePlannerIdx:activePlannerIdx.value,mode:mode.value,pos},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (activePlannerIdx.value === null) return;
    const idx = activePlannerIdx.value;
    pushPathUndo(idx);
    pathRedoStacks.value[idx] = [];
    const u = units.value[idx]!;
    u.path = [{ x: u.x, y: u.y }, pos];
    u.currentPathIdx = 0;
    // #region agent log
    fetch('http://127.0.0.1:7525/ingest/a523c2c6-b217-4642-94e6-5b99fe0996b8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dc1890'},body:JSON.stringify({sessionId:'dc1890',runId:'repro9',hypothesisId:'H1',location:'src/stores/gameStore.ts:beginPathAt',message:'path initialized',data:{idx,unitId:u.id,pathLen:u.path.length,timelineLen:timeline.value.length,timelineIndex:timelineIndex.value,t0PathLens:timeline.value[0]?.units?.map(x=>({id:x.id,pathLen:x.path.length}))},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }

  function extendPathIfFarEnough(pos: Point): void {
    if (activePlannerIdx.value === null) return;
    const idx = activePlannerIdx.value;
    const u = units.value[idx]!;
    const last = u.path[u.path.length - 1];
    if (!last) return;
    if (Math.hypot(pos.x - last.x, pos.y - last.y) > PATH_SAMPLE_MIN_DIST) {
      u.path.push(pos);
      if (u.path.length % 6 === 0) {
        let turnSum = 0;
        let turnCount = 0;
        for (let i = 2; i < u.path.length; i++) {
          const a = u.path[i - 2]!;
          const b = u.path[i - 1]!;
          const c = u.path[i]!;
          const v1x = b.x - a.x;
          const v1y = b.y - a.y;
          const v2x = c.x - b.x;
          const v2y = c.y - b.y;
          const n1 = Math.hypot(v1x, v1y);
          const n2 = Math.hypot(v2x, v2y);
          if (n1 < 1e-3 || n2 < 1e-3) continue;
          const cos = Math.max(-1, Math.min(1, (v1x * v2x + v1y * v2y) / (n1 * n2)));
          turnSum += Math.acos(cos);
          turnCount++;
        }
        // #region agent log
        fetch('http://127.0.0.1:7525/ingest/a523c2c6-b217-4642-94e6-5b99fe0996b8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dc1890'},body:JSON.stringify({sessionId:'dc1890',runId:'repro15',hypothesisId:'H1',location:'src/stores/gameStore.ts:extendPathIfFarEnough',message:'path sampling roughness stats',data:{unitId:u.id,pathLen:u.path.length,avgTurnDeg:turnCount>0?(turnSum/turnCount)*180/Math.PI:0,lastPoint:pos,minDist:PATH_SAMPLE_MIN_DIST},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
      }
      // #region agent log
      fetch('http://127.0.0.1:7525/ingest/a523c2c6-b217-4642-94e6-5b99fe0996b8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dc1890'},body:JSON.stringify({sessionId:'dc1890',runId:'repro9',hypothesisId:'H1',location:'src/stores/gameStore.ts:extendPathIfFarEnough',message:'path extended',data:{idx,unitId:u.id,pathLen:u.path.length,timelineLen:timeline.value.length,timelineIndex:timelineIndex.value,t0PathLens:timeline.value[0]?.units?.map(x=>({id:x.id,pathLen:x.path.length}))},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
    }
  }

  function smoothPathPoints(points: Point[]): Point[] {
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

  function finalizePathDrawing(): void {
    if (activePlannerIdx.value === null) return;
    const idx = activePlannerIdx.value;
    const u = units.value[idx]!;
    if (u.path.length < 4) return;
    const beforeLen = u.path.length;
    u.path = smoothPathPoints(u.path);
    // #region agent log
    fetch('http://127.0.0.1:7525/ingest/a523c2c6-b217-4642-94e6-5b99fe0996b8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dc1890'},body:JSON.stringify({sessionId:'dc1890',runId:'repro16',hypothesisId:'H4',location:'src/stores/gameStore.ts:finalizePathDrawing',message:'path smoothed on pointer up',data:{unitId:u.id,beforeLen,afterLen:u.path.length,start:u.path[0],end:u.path[u.path.length-1]},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }

  function undoPathEdit(): void {
    if (activePlannerIdx.value === null) return;
    const idx = activePlannerIdx.value;
    const prev = pathUndoStacks.value[idx]!.pop();
    if (!prev) return;
    pathRedoStacks.value[idx]!.push(clonePath(units.value[idx]!.path));
    units.value[idx]!.path = clonePath(prev);
    units.value[idx]!.currentPathIdx = Math.min(units.value[idx]!.currentPathIdx, Math.max(0, prev.length - 1));
    addLog('系统', `已撤销 ${units.value[idx]!.id} 路线编辑`, 'log-miss');
  }

  function redoPathEdit(): void {
    if (activePlannerIdx.value === null) return;
    const idx = activePlannerIdx.value;
    const next = pathRedoStacks.value[idx]!.pop();
    if (!next) return;
    pathUndoStacks.value[idx]!.push(clonePath(units.value[idx]!.path));
    units.value[idx]!.path = clonePath(next);
    units.value[idx]!.currentPathIdx = Math.min(units.value[idx]!.currentPathIdx, Math.max(0, next.length - 1));
    addLog('系统', `已重做 ${units.value[idx]!.id} 路线编辑`, 'log-miss');
  }

  function startExecution(): void {
    if (mode.value === 'gameover') return;
    const plannedBaseline = cloneFrame();
    if (timeline.value.length === 0) timeline.value.push(plannedBaseline);
    else timeline.value[0] = plannedBaseline;
    timelineIndex.value = 0;

    // #region agent log
    fetch('http://127.0.0.1:7525/ingest/a523c2c6-b217-4642-94e6-5b99fe0996b8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dc1890'},body:JSON.stringify({sessionId:'dc1890',runId:'repro12',hypothesisId:'H1',location:'src/stores/gameStore.ts:startExecution',message:'planned baseline persisted to timeline[0]',data:{timelineLen:timeline.value.length,timelineIndex:timelineIndex.value,t0Paths:timeline.value[0]?.units?.map(u=>({id:u.id,pathLen:u.path.length,currentPathIdx:u.currentPathIdx})),t0Mode:timeline.value[0]?.mode,t0Time:timeline.value[0]?.simElapsedMs},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    mode.value = 'executing';
    executionState.value = 'running';
    toolbarHighlight.value = 'exec';
    // #region agent log
    fetch('http://127.0.0.1:7525/ingest/a523c2c6-b217-4642-94e6-5b99fe0996b8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dc1890'},body:JSON.stringify({sessionId:'dc1890',runId:'repro6',hypothesisId:'H1',location:'src/stores/gameStore.ts:startExecution',message:'startExecution called',data:{mode:mode.value,paths:units.value.map(u=>({id:u.id,pathLen:u.path.length,currentPathIdx:u.currentPathIdx,angle:u.angle}))},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    addLog('系统', '命令已下达，单位开始沿路径移动。', 'log-miss');
    // #region agent log
    fetch('http://127.0.0.1:7525/ingest/a523c2c6-b217-4642-94e6-5b99fe0996b8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dc1890'},body:JSON.stringify({sessionId:'dc1890',runId:'repro9',hypothesisId:'H2',location:'src/stores/gameStore.ts:startExecution',message:'execution started timeline snapshot',data:{timelineLen:timeline.value.length,timelineIndex:timelineIndex.value,currentPathLens:units.value.map(u=>({id:u.id,pathLen:u.path.length,idx:u.currentPathIdx})),t0PathLens:timeline.value[0]?.units?.map(x=>({id:x.id,pathLen:x.path.length}))},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }

  function pauseExecution(): void {
    if (mode.value !== 'executing') return;
    executionState.value = 'paused';
    addLog('系统', '执行已暂停。', 'log-miss');
  }

  function resumeExecution(): void {
    if (mode.value !== 'executing') return;
    executionState.value = 'running';
    addLog('系统', '执行已恢复。', 'log-miss');
  }

  function resetSandbox(): void {
    initGame();
  }

  function cloneFrame(): TimelineFrame {
    return {
      units: units.value.map((u) => ({
        ...u,
        path: u.path.map((p) => ({ ...p })),
      })),
      shots: shots.value.map((s) => ({ ...s })),
      logs: logs.value.map((l) => ({ ...l })),
      mode: mode.value,
      simElapsedMs: simElapsedMs.value,
    };
  }

  function restoreFrame(frame: TimelineFrame): void {
    units.value = frame.units.map((u) => ({ ...u, path: u.path.map((p) => ({ ...p })) }));
    shots.value = frame.shots.map((s) => ({ ...s }));
    logs.value = frame.logs.map((l) => ({ ...l }));
    mode.value = frame.mode;
    simElapsedMs.value = frame.simElapsedMs;
    if (mode.value === 'executing') executionState.value = 'paused';
  }

  function stepBackward(): void {
    if (timelineIndex.value <= playbackMin.value) return;
    timelineIndex.value -= 1;
    if (timelineIndex.value < playbackMin.value) timelineIndex.value = playbackMin.value;
    restoreFrame(timeline.value[timelineIndex.value]!);
    toolbarHighlight.value = 'exec';
    // #region agent log
    fetch('http://127.0.0.1:7525/ingest/a523c2c6-b217-4642-94e6-5b99fe0996b8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dc1890'},body:JSON.stringify({sessionId:'dc1890',runId:'repro10',hypothesisId:'H5',location:'src/stores/gameStore.ts:stepBackward',message:'step back applied with floor',data:{playbackMin:playbackMin.value,timelineIndex:timelineIndex.value,timelineLen:timeline.value.length},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }

  function stepForward(): void {
    if (timelineIndex.value < timeline.value.length - 1) {
      timelineIndex.value += 1;
      restoreFrame(timeline.value[timelineIndex.value]!);
      toolbarHighlight.value = 'exec';
      return;
    }
    if (mode.value !== 'executing') return;
    runSimulationTick();
    commitTimelineFrame();
    executionState.value = 'paused';
    toolbarHighlight.value = 'exec';
  }

  function seekTimeline(index: number): void {
    const target = Math.max(playbackMin.value, Math.min(index, timeline.value.length - 1));
    if (!timeline.value[target]) return;
    timelineIndex.value = target;
    restoreFrame(timeline.value[target]!);
    executionState.value = 'paused';
    toolbarHighlight.value = 'exec';
    // #region agent log
    fetch('http://127.0.0.1:7525/ingest/a523c2c6-b217-4642-94e6-5b99fe0996b8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dc1890'},body:JSON.stringify({sessionId:'dc1890',runId:'repro10',hypothesisId:'H5',location:'src/stores/gameStore.ts:seekTimeline',message:'seek applied with floor',data:{requested:index,target,playbackMin:playbackMin.value,timelineLen:timeline.value.length,restoredPathLens:units.value.map(u=>({id:u.id,pathLen:u.path.length,idx:u.currentPathIdx}))},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }

  function tick(_timestamp?: number): void {
    if (mode.value !== 'executing' || executionState.value !== 'running') return;
    runSimulationTick();
    commitTimelineFrame();
  }

  function runSimulationTick(): void {
    debugTickCount++;
    simElapsedMs.value += SIM_STEP_MS;
    for (let i = shots.value.length - 1; i >= 0; i--) {
      const s = shots.value[i]!;
      s.alpha -= SHOT_ALPHA_DECAY;
      if (s.alpha <= 0) shots.value.splice(i, 1);
    }
    const before = units.value.map((u) => ({ id: u.id, x: u.x, y: u.y, idx: u.currentPathIdx, angle: u.angle, hp: u.hp }));
    for (const u of units.value) advanceUnitAlongPath(u);
    const now = Date.now();
    const [blue, red] = units.value;
    if (blue && red && !blue.dead && !red.dead) {
      tryFire(blue, red, now);
      tryFire(red, blue, now);
    }
    if (debugTickCount % 20 === 0) {
      // #region agent log
      fetch('http://127.0.0.1:7525/ingest/a523c2c6-b217-4642-94e6-5b99fe0996b8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dc1890'},body:JSON.stringify({sessionId:'dc1890',runId:'repro7',hypothesisId:'H2',location:'src/stores/gameStore.ts:tick',message:'executing tick snapshot',data:{mode:mode.value,before,after:units.value.map(u=>({id:u.id,x:u.x,y:u.y,idx:u.currentPathIdx,angle:u.angle,hp:u.hp,lastFireTime:u.lastFireTime,pathLen:u.path.length})),shots:shots.value.length},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
    }
    if (blue?.dead || red?.dead) {
      mode.value = 'gameover';
      executionState.value = 'stopped';
    }
  }

  function commitTimelineFrame(): void {
    if (timelineIndex.value < timeline.value.length - 1) {
      timeline.value = timeline.value.slice(0, timelineIndex.value + 1);
    }
    timeline.value.push(cloneFrame());
    timelineIndex.value = timeline.value.length - 1;
    if (timelineIndex.value === 1 || timelineIndex.value % 120 === 0) {
      // #region agent log
      fetch('http://127.0.0.1:7525/ingest/a523c2c6-b217-4642-94e6-5b99fe0996b8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dc1890'},body:JSON.stringify({sessionId:'dc1890',runId:'repro9',hypothesisId:'H4',location:'src/stores/gameStore.ts:commitTimelineFrame',message:'timeline frame committed',data:{timelineLen:timeline.value.length,timelineIndex:timelineIndex.value,t0PathLens:timeline.value[0]?.units?.map(x=>({id:x.id,pathLen:x.path.length})),tailPathLens:timeline.value[timelineIndex.value]?.units?.map(x=>({id:x.id,pathLen:x.path.length,idx:x.currentPathIdx}))},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
    }
    if (timeline.value.length > 1200) {
      timeline.value.shift();
      timelineIndex.value = Math.max(0, timelineIndex.value - 1);
    }
  }

  function tryFire(attacker: RuntimeUnit, target: RuntimeUnit, now: number): void {
    if (attacker.dead || target.dead) return;
    const dx = target.x - attacker.x;
    const dy = target.y - attacker.y;
    const distance = Math.hypot(dx, dy);
    if (distance > MAX_RANGE) return;
    if (now - attacker.lastFireTime < FIRE_COOLDOWN_MS) return;

    attacker.lastFireTime = now;
    attacker.angle = Math.atan2(dy, dx);

    const blocked = segmentBlockedByAnyCover(attacker.x, attacker.y, target.x, target.y, COVERS);
    const throughBush = segmentNearAnyBush(attacker.x, attacker.y, target.x, target.y, BUSHES);

    let hitChance = BASE_HIT_CHANCE;
    if (blocked) hitChance *= 0.25;
    if (throughBush) hitChance *= 0.6;

    const hit = Math.random() < hitChance;
    shots.value.push({
      x1: attacker.x,
      y1: attacker.y,
      x2: target.x,
      y2: target.y,
      color: attacker.stroke,
      alpha: 1,
      blocked,
    });

    if (hit) {
      const damage = 16 + Math.floor(Math.random() * 15);
      target.hp = Math.max(0, target.hp - damage);
      if (target.hp === 0) {
        target.dead = true;
        addLog(attacker.id, `击毙 ${target.id}`, 'log-kill');
      } else {
        addLog(attacker.id, `命中 ${target.id} -${damage}HP`, 'log-hit');
      }
    } else {
      addLog(attacker.id, `射击 ${target.id} 未命中`, 'log-miss');
    }

    // #region agent log
    fetch('http://127.0.0.1:7525/ingest/a523c2c6-b217-4642-94e6-5b99fe0996b8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dc1890'},body:JSON.stringify({sessionId:'dc1890',runId:'repro7',hypothesisId:'H4',location:'src/stores/gameStore.ts:tryFire',message:'shot resolved',data:{attacker:attacker.id,target:target.id,distance,blocked,throughBush,hitChance,hit,targetHp:target.hp,shots:shots.value.length},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }

  initGame();

  return {
    mode,
    executionState,
    units,
    shots,
    logs,
    toolbarHighlight,
    renderSnapshot,
    canStepBack,
    canStepForward,
    canUndoPathEdit,
    canRedoPathEdit,
    playbackMin,
    playbackMax,
    timelineIndex,
    initGame,
    selectPlannerByPoint,
    beginPathAt,
    extendPathIfFarEnough,
    finalizePathDrawing,
    undoPathEdit,
    redoPathEdit,
    startExecution,
    pauseExecution,
    resumeExecution,
    stepBackward,
    stepForward,
    seekTimeline,
    resetSandbox,
    tick,
  };
});
