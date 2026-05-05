import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { FIRE_INTERVAL_MS, PATH_SAMPLE_MIN_DIST, SHOT_ALPHA_DECAY } from '@/domain/constants';
import { BUSHES, COVERS } from '@/domain/terrain';
import type { GameMode, LogEntry, Point, RuntimeUnit, ShotTrail } from '@/domain/types';
import { createRuntimeUnitsFromTemplates, UNIT_TEMPLATES } from '@/domain/units';
import { resolveRangedAttack } from '@/game/combat';
import { advanceUnitAlongPath } from '@/game/movement';
import { formatTimeZh } from '@/utils/timeFormat';

/** 编排游戏状态与规则；几何/移动/射击判定委托给 domain / game 模块 */

export const useGameStore = defineStore('game', () => {
  const mode = ref<GameMode>('idle');
  const units = ref<RuntimeUnit[]>([]);
  const shots = ref<ShotTrail[]>([]);
  const logs = ref<LogEntry[]>([]);
  const toolbarHighlight = ref<'blue' | 'red' | 'exec' | null>(null);

  const terrain = { covers: COVERS, bushes: BUSHES };

  const renderSnapshot = computed(() => ({
    covers: terrain.covers,
    bushes: terrain.bushes,
    units: units.value,
    shots: shots.value,
  }));

  const routePlanningLocked = computed(
    () => mode.value === 'executing' || mode.value === 'gameover',
  );

  function pushLog(unitId: string, text: string, tone: LogEntry['tone']): void {
    logs.value.push({
      timeLabel: formatTimeZh(),
      unitId,
      text,
      tone,
    });
  }

  function initGame(): void {
    units.value = createRuntimeUnitsFromTemplates(UNIT_TEMPLATES);
    shots.value = [];
    mode.value = 'idle';
    logs.value = [];
    toolbarHighlight.value = null;
    pushLog('系统', '沙盘已初始化，等待指挥官下达路线指令...', 'log-miss');
  }

  function setPlanBlue(): void {
    if (mode.value !== 'idle' && mode.value !== 'planRed') return;
    mode.value = 'planBlue';
    toolbarHighlight.value = 'blue';
    const u = units.value[0]!;
    u.path = [];
    u.currentPathIdx = 0;
  }

  function setPlanRed(): void {
    if (mode.value !== 'idle' && mode.value !== 'planBlue') return;
    mode.value = 'planRed';
    toolbarHighlight.value = 'red';
    const u = units.value[1]!;
    u.path = [];
    u.currentPathIdx = 0;
  }

  function startExecution(): void {
    if (mode.value !== 'planBlue' && mode.value !== 'planRed' && mode.value !== 'idle') return;
    mode.value = 'executing';
    toolbarHighlight.value = 'exec';
    pushLog('系统', '命令已下达，行动开始！', 'log-miss');
  }

  function resetSandbox(): void {
    initGame();
  }

  function beginPathAt(pos: Point): void {
    if (mode.value !== 'planBlue' && mode.value !== 'planRed') return;
    const idx = mode.value === 'planBlue' ? 0 : 1;
    const u = units.value[idx]!;
    u.path = [{ x: u.x, y: u.y }, { ...pos }];
    u.currentPathIdx = 0;
  }

  function extendPathIfFarEnough(pos: Point): void {
    if (mode.value !== 'planBlue' && mode.value !== 'planRed') return;
    const idx = mode.value === 'planBlue' ? 0 : 1;
    const u = units.value[idx]!;
    const last = u.path[u.path.length - 1];
    if (!last) return;
    if (Math.hypot(pos.x - last.x, pos.y - last.y) > PATH_SAMPLE_MIN_DIST) {
      u.path.push({ ...pos });
    }
  }

  function decayShots(): void {
    for (let i = shots.value.length - 1; i >= 0; i--) {
      const s = shots.value[i]!;
      s.alpha -= SHOT_ALPHA_DECAY;
      if (s.alpha <= 0) shots.value.splice(i, 1);
    }
  }

  function tryMutualFire(timestamp: number): void {
    const u0 = units.value[0]!;
    const u1 = units.value[1]!;
    if (u0.dead || u1.dead) return;

    u0.angle = Math.atan2(u1.y - u0.y, u1.x - u0.x);
    u1.angle = Math.atan2(u0.y - u1.y, u0.x - u1.x);

    const rng = () => Math.random();

    units.value.forEach((shooter, idx) => {
      if (shooter.dead) return;
      if (timestamp - shooter.lastFireTime <= FIRE_INTERVAL_MS) return;
      shooter.lastFireTime = timestamp;

      const target = units.value[1 - idx]!;
      const res = resolveRangedAttack({
        sx: shooter.x,
        sy: shooter.y,
        tx: target.x,
        ty: target.y,
        covers: COVERS,
        bushes: BUSHES,
        rng,
      });

      shots.value.push({
        x1: shooter.x,
        y1: shooter.y,
        x2: target.x,
        y2: target.y,
        color: res.tracerColor,
        alpha: 1,
        blocked: res.losBlocked,
      });

      if (res.losBlocked) return;

      const prefix = res.inFoliage ? '(穿透射击) ' : '';
      if (res.hit) {
        target.hp -= res.damage;
        pushLog(shooter.id, `${prefix}命中目标！造成 ${res.damage} 伤害！`, 'log-hit');
        if (target.hp <= 0) {
          target.hp = 0;
          target.dead = true;
          pushLog(target.id, '阵亡！', 'log-kill');
        }
      } else {
        pushLog(shooter.id, `${prefix}射击未命中。`, 'log-miss');
      }
    });
  }

  function resolveGameOverIfNeeded(): void {
    const u0 = units.value[0]!;
    const u1 = units.value[1]!;
    if (mode.value !== 'executing') return;
    if (!u0.dead && !u1.dead) return;
    mode.value = 'gameover';
    const winner = u0.dead ? u1.id : u0.id;
    pushLog('指挥中心', `战斗结束！${winner} 取得胜利！`, 'log-kill');
  }

  function tick(timestamp: number): void {
    decayShots();

    if (mode.value === 'executing') {
      for (const u of units.value) {
        advanceUnitAlongPath(u);
      }
      tryMutualFire(timestamp);
      resolveGameOverIfNeeded();
    }
  }

  initGame();

  return {
    mode,
    units,
    shots,
    logs,
    toolbarHighlight,
    renderSnapshot,
    routePlanningLocked,
    initGame,
    setPlanBlue,
    setPlanRed,
    startExecution,
    resetSandbox,
    beginPathAt,
    extendPathIfFarEnough,
    tick,
  };
});
