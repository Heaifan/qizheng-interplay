import type { CasualtyPoint, LogEntry, RuntimeUnit } from '@/domain/types';
import { getWeaponById } from '@/domain/weaponRegistry';
import { getUnitDisplayName } from '@/domain/unitDisplay';

export interface BattleReportUnit {
  id: string;
  faction: string;
  displayName: string;
  weaponId: string;
  weaponName: string;
  finalHp: number;
  finalHpPct: number;
}

export interface BattleReportResult {
  winner: string | null;
  redPct: number;
  bluePct: number;
}

export interface BattleReport {
  exportedAt: string;
  version: string;
  durationSec: number;
  units: BattleReportUnit[];
  result: BattleReportResult;
  logs: string[];
  casualtyTable: string[];
}

/** 收集战斗数据生成报告 */
export function buildBattleReport(input: {
  version: string;
  units: readonly RuntimeUnit[];
  logs: readonly LogEntry[];
  casualtySeries: readonly CasualtyPoint[];
  simElapsedMs: number;
}): BattleReport {
  const units: BattleReportUnit[] = input.units.map((u) => {
    const weapon = getWeaponById(u.weaponId);
    return {
      id: u.id,
      faction: u.combatProfile.faction,
      displayName: getUnitDisplayName(u),
      weaponId: u.weaponId,
      weaponName: weapon?.displayName ?? weapon?.name ?? '?',
      finalHp: u.hp,
      finalHpPct: u.dead ? 0 : Math.round((u.hp / 100) * 100),
    };
  });

  const red = units.find((u) => u.faction === 'red');
  const blue = units.find((u) => u.faction === 'blue');

  const result: BattleReportResult = {
    winner: null,
    redPct: red?.finalHpPct ?? 0,
    bluePct: blue?.finalHpPct ?? 0,
  };
  if (red && red.finalHpPct <= 0) result.winner = '蓝方';
  else if (blue && blue.finalHpPct <= 0) result.winner = '红方';

  // Full combat logs (not visibleLogs — always complete)
  const logs: string[] = input.logs.map((l) => `[${l.timeLabel}] ${l.unitId !== '系统' ? `${l.unitId} ` : ''}${l.text}`);

  // Sampled casualty table (once per second)
  const seen = new Set<number>();
  const casualtyTable: string[] = [];
  for (const cp of input.casualtySeries) {
    const sec = Math.floor(cp.timeSec);
    if (!seen.has(sec) || cp.timeSec === 0) {
      seen.add(sec);
      casualtyTable.push(`| ${cp.timeSec}s | ${Math.round(cp.blueHpPct)}% | ${Math.round(cp.redHpPct)}% |`);
    }
  }

  return {
    exportedAt: new Date().toISOString(),
    version: input.version,
    durationSec: Math.floor(input.simElapsedMs / 1000),
    units,
    result,
    logs,
    casualtyTable,
  };
}

/** 格式化为 Markdown */
export function reportToMarkdown(report: BattleReport): string {
  const lines: string[] = [];
  lines.push('# 奇正相生 - 战斗报告\n');
  lines.push('## 基本信息\n');
  lines.push(`| 字段 | 值 |`);
  lines.push(`| --- | --- |`);
  lines.push(`| 版本 | ${report.version} |`);
  lines.push(`| 导出时间 | ${report.exportedAt} |`);
  lines.push(`| 战斗时长 | ${report.durationSec}s |`);
  if (report.result.winner) {
    lines.push(`| 结果 | ${report.result.winner} 获胜 |`);
  }
  lines.push('');

  lines.push('## 参战单位\n');
  lines.push(`| 阵营 | 单位 | 武器 | 剩余血量 |`);
  lines.push(`| --- | --- | --- | ---:|`);
  for (const u of report.units) {
    const fac = u.faction === 'blue' ? '蓝方' : '红方';
    lines.push(`| ${fac} | ${u.displayName} | ${u.weaponName} | ${u.finalHpPct}% |`);
  }
  lines.push('');

  if (report.casualtyTable.length > 0) {
    lines.push('## 战损统计\n');
    lines.push(`| 时间 | ${report.units.find((u) => u.faction === 'blue')?.displayName ?? '蓝方'} | ${report.units.find((u) => u.faction === 'red')?.displayName ?? '红方'} |`);
    lines.push(`| --- | ---:| ---:|`);
    for (const row of report.casualtyTable) lines.push(row);
    lines.push('');
  }

  lines.push('## 战斗日志\n');
  for (const log of report.logs) lines.push(`- ${log}`);

  return lines.join('\n');
}
