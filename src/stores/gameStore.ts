import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { PATH_SAMPLE_MIN_DIST, SHOT_ALPHA_DECAY } from '@/domain/constants';
import { BUSHES, COVERS } from '@/domain/terrain';
import type { GameMode, LogEntry, Point, RuntimeUnit, ShotTrail } from '@/domain/types';
import { createRuntimeUnitsFromTemplates, UNIT_TEMPLATES } from '@/domain/units';
import { advanceUnitAlongPath } from '@/game/movement';
import { segmentBlockedByAnyCover, segmentNearAnyBush } from '@/domain/geometry';

function nowLabel(): string {
  return new Date().toLocaleTimeString('zh-CN', { hour12: false });
}

export const useGameStore = defineStore('game', () => {
  const mode = ref<GameMode>('idle');
  const units = ref<RuntimeUnit[]>([]);
  const shots = ref<ShotTrail[]>([]);
  const logs = ref<LogEntry[]>([]);
  const toolbarHighlight = ref<'blue' | 'red' | 'exec' | null>(null);
  let debugTickCount = 0;
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

  function addLog(unitId: string, text: string, tone: LogEntry['tone']): void {
    logs.value.push({ timeLabel: nowLabel(), unitId, text, tone });
  }

  function initGame(): void {
    units.value = createRuntimeUnitsFromTemplates(UNIT_TEMPLATES);
    shots.value = [];
    logs.value = [];
    mode.value = 'idle';
    toolbarHighlight.value = null;
    addLog('系统', '右键单位后开始绘制路径。', 'log-miss');
  }

  function selectPlannerByPoint(pos: Point): boolean {
    if (mode.value === 'executing' || mode.value === 'gameover') return false;
    const nearest = units.value
      .map((u, idx) => ({ idx, d: Math.hypot(u.x - pos.x, u.y - pos.y), id: u.id }))
      .sort((a, b) => a.d - b.d)[0];
    if (!nearest || nearest.d > 30) return false;
    mode.value = nearest.idx === 0 ? 'planBlue' : 'planRed';
    toolbarHighlight.value = nearest.idx === 0 ? 'blue' : 'red';
    const u = units.value[nearest.idx]!;
    u.path = [];
    u.currentPathIdx = 0;
    addLog('系统', `已选择${nearest.id}，可开始绘制路径。`, 'log-miss');
    return true;
  }

  function beginPathAt(pos: Point): void {
    if (mode.value !== 'planBlue' && mode.value !== 'planRed') return;
    const idx = mode.value === 'planBlue' ? 0 : 1;
    const u = units.value[idx]!;
    u.path = [{ x: u.x, y: u.y }, pos];
    u.currentPathIdx = 0;
  }

  function extendPathIfFarEnough(pos: Point): void {
    if (mode.value !== 'planBlue' && mode.value !== 'planRed') return;
    const idx = mode.value === 'planBlue' ? 0 : 1;
    const u = units.value[idx]!;
    const last = u.path[u.path.length - 1];
    if (!last) return;
    if (Math.hypot(pos.x - last.x, pos.y - last.y) > PATH_SAMPLE_MIN_DIST) {
      u.path.push(pos);
    }
  }

  function startExecution(): void {
    if (mode.value === 'executing' || mode.value === 'gameover') return;
    mode.value = 'executing';
    toolbarHighlight.value = 'exec';
    // #region agent log
    fetch('http://127.0.0.1:7525/ingest/a523c2c6-b217-4642-94e6-5b99fe0996b8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dc1890'},body:JSON.stringify({sessionId:'dc1890',runId:'repro6',hypothesisId:'H1',location:'src/stores/gameStore.ts:startExecution',message:'startExecution called',data:{mode:mode.value,paths:units.value.map(u=>({id:u.id,pathLen:u.path.length,currentPathIdx:u.currentPathIdx,angle:u.angle}))},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    addLog('系统', '命令已下达，单位开始沿路径移动。', 'log-miss');
  }

  function resetSandbox(): void {
    initGame();
  }

  function tick(_timestamp?: number): void {
    debugTickCount++;
    for (let i = shots.value.length - 1; i >= 0; i--) {
      const s = shots.value[i]!;
      s.alpha -= SHOT_ALPHA_DECAY;
      if (s.alpha <= 0) shots.value.splice(i, 1);
    }
    if (mode.value === 'executing') {
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
      if (blue?.dead || red?.dead) mode.value = 'gameover';
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
    units,
    shots,
    logs,
    toolbarHighlight,
    renderSnapshot,
    initGame,
    selectPlannerByPoint,
    beginPathAt,
    extendPathIfFarEnough,
    startExecution,
    resetSandbox,
    tick,
  };
});
