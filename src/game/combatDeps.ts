// ============================================================
// combatDeps — 战斗动作依赖与常量
//
// 从原 combat.ts 拆分，保持本文件 ≤100 行。
// CombatDeps 持有运行时依赖；terrainMap 用于真实开火链路接入地形。
// ============================================================

import type { Ref } from 'vue';
import type { BattleTerrainMap } from '@/domain/terrainMap';
import type { LogEntry, RuntimeUnit, ShotTrail } from '@/domain/types';

export const FIRE_ARC_HALF_RAD = (60 * Math.PI) / 360;

export function missionTimeLabel(elapsedMs: number): string {
  const sec = Math.max(0, Math.floor(elapsedMs / 1000));
  return `T+${sec}s`;
}

export interface CombatDeps {
  units: Ref<RuntimeUnit[]>;
  shots: Ref<ShotTrail[]>;
  logs: Ref<LogEntry[]>;
  mode: Ref<string>;
  executionState: Ref<string>;
  simElapsedMs: Ref<number>;
  terrainMap: Ref<BattleTerrainMap | null>;
  addLog: (unitId: string, text: string, tone: LogEntry['tone']) => void;
}
