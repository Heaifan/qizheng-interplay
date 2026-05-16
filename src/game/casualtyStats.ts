import type { CasualtyPoint, RuntimeUnit } from '@/domain/types';
import type { TimelineFrame } from './timeline';

export interface HpTotals {
  red: number;
  blue: number;
}

/** 计算初始 HP 总和 */
export function computeInitialHpTotals(units: readonly RuntimeUnit[]): HpTotals {
  let red = 0;
  let blue = 0;
  for (const u of units) {
    if (u.combatProfile.faction === 'red') red += u.hp;
    else blue += u.hp;
  }
  return { red, blue };
}

/** 从帧的单位列表计算当前 HP */
function sumHpByFaction(units: readonly RuntimeUnit[]): { red: number; blue: number } {
  let red = 0;
  let blue = 0;
  for (const u of units) {
    if (u.combatProfile.faction === 'red') red += u.hp;
    else blue += u.hp;
  }
  return { red, blue };
}

/** 从 timeline 帧序列生成战损统计点（时间相对第一帧归零） */
export function buildCasualtySeries(
  frames: readonly TimelineFrame[],
  initial: HpTotals,
): CasualtyPoint[] {
  if (frames.length === 0) return [];
  const baseMs = frames[0]!.simElapsedMs;
  return frames.map((frame) => {
    const { red: redHp, blue: blueHp } = sumHpByFaction(frame.units);
    const timeSec = Math.round((frame.simElapsedMs - baseMs) / 1000);
    return {
      timeSec,
      redHpValue: redHp,
      blueHpValue: blueHp,
      redHpPct: initial.red > 0 ? (redHp / initial.red) * 100 : 100,
      blueHpPct: initial.blue > 0 ? (blueHp / initial.blue) * 100 : 100,
      redLoss: initial.red - redHp,
      blueLoss: initial.blue - blueHp,
    };
  });
}
