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
  shotsFired: number;
  hits: number;
  totalDamage: number;
  suppression: number;
  peakSuppression: number;
  suppressionDealt: number;
  suppressionReceived: number;
  suppressionHitCount: number;
}

export interface BattleReport {
  exportedAt: string;
  version: string;
  durationSec: number;
  units: BattleReportUnit[];
  winner: string | null;
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
  // Parse combat logs to extract stats
  const unitStats = new Map<string, { shotsFired: number; hits: number; totalDamage: number }>();
  for (const l of input.logs) {
    if (l.tone === 'log-hit' || l.tone === 'log-kill' || l.tone === 'log-miss') {
      const stats = unitStats.get(l.unitId) ?? { shotsFired: 0, hits: 0, totalDamage: 0 };
      stats.shotsFired++;
      if (l.tone === 'log-hit' || l.tone === 'log-kill') {
        stats.hits++;
        // Extract damage number from log text (e.g., "造成 23 伤害" or "造成 18 伤害，击毙")
        const dmgMatch = l.text.match(/造成 (\d+) 伤害/);
        if (dmgMatch) stats.totalDamage += parseInt(dmgMatch[1]!, 10);
      }
      unitStats.set(l.unitId, stats);
    }
  }

  const units: BattleReportUnit[] = input.units.map((u) => {
    const weapon = getWeaponById(u.weaponId);
    const stats = unitStats.get(u.id) ?? { shotsFired: 0, hits: 0, totalDamage: 0 };
    return {
      id: u.id,
      faction: u.combatProfile.faction,
      displayName: getUnitDisplayName(u),
      weaponId: u.weaponId,
      weaponName: weapon?.displayName ?? weapon?.name ?? '?',
      finalHp: u.hp,
      finalHpPct: u.dead ? 0 : Math.round((u.hp / 100) * 100),
      suppression: u.suppression ?? 0,
      peakSuppression: u.peakSuppression ?? 0,
      suppressionDealt: u.suppressionDealt ?? 0,
      suppressionReceived: u.suppressionReceived ?? 0,
      suppressionHitCount: u.suppressionHitCount ?? 0,
      ...stats,
    };
  });

  const red = units.find((u) => u.faction === 'red');
  const blue = units.find((u) => u.faction === 'blue');
  let winner: string | null = null;
  if (red && red.finalHpPct <= 0) winner = '蓝方';
  else if (blue && blue.finalHpPct <= 0) winner = '红方';

  // Filter: keep combat/log-system (drop repeated planning logs)
  const skipPhrases = ['已选择', '可开始绘制路径', '右键单位'];
  const logs: string[] = input.logs
    .filter((l) => {
      if (l.tone === 'log-system' && skipPhrases.some((p) => l.text.includes(p))) return false;
      return true;
    })
    .map((l) => `[${l.timeLabel}] ${l.unitId !== '系统' ? `${l.unitId} ` : ''}${l.text}`);

  // Sampled casualty table — only when HP changes + first + last
  const seenPct = new Set<string>();
  const casualtyTable: string[] = [];
  let lastKey = '';
  for (const cp of input.casualtySeries) {
    const key = `${Math.round(cp.blueHpPct)},${Math.round(cp.redHpPct)}`;
    if (key !== lastKey) {
      lastKey = key;
      seenPct.add(key);
      casualtyTable.push(`| ${cp.timeSec}s | ${Math.round(cp.blueHpPct)}% | ${Math.round(cp.redHpPct)}% |`);
    }
  }

  return { exportedAt: new Date().toISOString(), version: input.version, durationSec: Math.floor(input.simElapsedMs / 1000), units, winner, logs, casualtyTable };
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
  if (report.winner) lines.push(`| 结果 | ${report.winner} 获胜 |`);
  lines.push('');

  lines.push('## 参战单位\n');
  lines.push(`| 阵营 | 单位 | 武器 | 剩余血量 |`);
  lines.push(`| --- | --- | --- | ---:|`);
  for (const u of report.units) {
    lines.push(`| ${u.faction === 'blue' ? '蓝方' : '红方'} | ${u.displayName} | ${u.weaponName} | ${u.finalHpPct}% |`);
  }
  lines.push('');

  lines.push('## 火力统计\n');
  lines.push(`| 阵营 | 单位 | 武器 | 开火事件 | 命中次数 | 命中率 | 总伤害 | 命中均伤 | 最终压制 |`);
  lines.push(`| --- | --- | --- | ---:| ---:| ---:| ---:| ---:| ---:|`);
  for (const u of report.units) {
    const hitRate = u.shotsFired > 0 ? ((u.hits / u.shotsFired) * 100).toFixed(1) : '-';
    const avgDmg = u.hits > 0 ? (u.totalDamage / u.hits).toFixed(1) : '-';
    const supLabel = u.suppression > 0.75 ? '强压制' : u.suppression > 0.45 ? '中度' : u.suppression > 0.20 ? '轻度' : '无';
    lines.push(`| ${u.faction === 'blue' ? '蓝方' : '红方'} | ${u.displayName} | ${u.weaponName} | ${u.shotsFired} | ${u.hits} | ${hitRate}% | ${u.totalDamage} | ${avgDmg} | ${(u.suppression * 100).toFixed(0)}% ${supLabel} |`);
  }
  lines.push('');

  lines.push('## 压制统计\n');
  lines.push(`| 阵营 | 单位 | 最终压制 | 峰值压制 | 造成压制 | 受到压制 | 受压次数 | 命中影响 | 射速影响 |`);
  lines.push(`| --- | --- | ---:| ---:| ---:| ---:| ---:| ---:| ---:|`);
  for (const u of report.units) {
    const supLabel = u.suppression > 0.75 ? '强压制' : u.suppression > 0.45 ? '中度' : u.suppression > 0.20 ? '轻度' : '无';
    const hitMult = Math.max(0.55, 1 - u.suppression * 0.45);
    const fireRateMult = 1 + u.suppression * 0.60;
    lines.push(`| ${u.faction === 'blue' ? '蓝方' : '红方'} | ${u.displayName} | ${(u.suppression * 100).toFixed(0)}% ${supLabel} | ${(u.peakSuppression * 100).toFixed(0)}% | ${u.suppressionDealt.toFixed(2)} | ${u.suppressionReceived.toFixed(2)} | ${u.suppressionHitCount} | ×${hitMult.toFixed(2)} | ×${fireRateMult.toFixed(2)} |`);
  }
  lines.push('');

  if (report.casualtyTable.length > 0) {
    lines.push('## 战损统计\n');
    const blueName = report.units.find((u) => u.faction === 'blue')?.displayName ?? '蓝方';
    const redName = report.units.find((u) => u.faction === 'red')?.displayName ?? '红方';
    lines.push(`| 时间 | ${blueName} | ${redName} |`);
    lines.push(`| --- | ---:| ---:|`);
    for (const row of report.casualtyTable) lines.push(row);
    lines.push('');
  }

  lines.push('## 战斗日志\n');
  for (const log of report.logs) lines.push(`- ${log}`);

  return lines.join('\n');
}
