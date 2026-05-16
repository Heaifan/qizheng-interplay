import type { EffectClass } from './types';
import type { RangeBandId } from './fireOutputTables';
import type { ProtectionLevel } from './fireOutput';

const EFFECT_CLASS_LABEL: Partial<Record<EffectClass, string>> = {
  pistol_round: '手枪弹',
  submachinegun_round: '冲锋枪弹',
  intermediate_rifle: '中间威力弹',
  full_power_rifle: '全威力步枪弹',
  heavy_machinegun_round: '重机枪弹',
  small_autocannon: '小口径机关炮',
  medium_autocannon: '中口径机关炮',
  tank_kinetic: '坦克动能弹',
  small_grenade: '小型手榴弹',
  medium_grenade: '中型手榴弹',
  light_mortar_shell: '轻型迫击炮弹',
  medium_mortar_shell: '中型迫击炮弹',
  heavy_mortar_shell: '重型迫击炮弹',
  field_artillery_shell: '野战炮弹',
  heavy_artillery_shell: '重型炮弹',
  anti_tank_rifle: '反坦克枪弹',
  light_at_gun: '轻型反坦克炮弹',
  medium_at_gun: '中型反坦克炮弹',
  heavy_at_gun: '重型反坦克炮弹',
  shaped_charge_light: '轻型破甲弹',
  shaped_charge_medium: '中型破甲弹',
  shaped_charge_heavy: '重型破甲弹',
  molotov: '燃烧瓶',
  flamethrower_light: '轻型火焰喷射器',
  flamethrower_heavy: '重型火焰喷射器',
  white_phosphorus: '白磷弹',
  demolition_charge_light: '轻型爆破装药',
  demolition_charge_medium: '中型爆破装药',
  demolition_charge_heavy: '重型爆破装药',
  satchel_charge: '爆破筒',
  bangalore_torpedo: '班加罗尔 torpedo',
};

const RANGE_BAND_LABEL: Record<RangeBandId, string> = {
  point_blank: '抵近',
  short: '近距',
  medium: '中距',
  long: '远距',
  extreme: '极远',
};

const PROTECTION_LABEL: Record<ProtectionLevel, string> = {
  none: '无防护',
  light_cover: '轻遮蔽',
  medium_cover: '中等遮蔽',
  heavy_cover: '厚重遮蔽',
  fortified: '工事',
  armored: '装甲',
};

const TARGET_LABEL: Record<string, string> = {
  personnel: '人员',
  light_vehicle: '轻车辆',
  armor: '装甲',
  structure: '工事',
  obstacle: '障碍',
};

export function formatEffectClass(ec: EffectClass): string {
  return EFFECT_CLASS_LABEL[ec] ?? ec;
}

export function formatRangeBand(rb: RangeBandId): string {
  return RANGE_BAND_LABEL[rb] ?? rb;
}

export function formatProtectionLevel(pl: ProtectionLevel): string {
  return PROTECTION_LABEL[pl] ?? pl;
}

export function formatTargetType(tt: string): string {
  return TARGET_LABEL[tt] ?? tt;
}

/** 简洁日志格式：火力输出0.75｜全威力步枪弹｜远距｜无防护 */
export function formatFireOutputTag(
  value: number,
  profileLabel: string,
  rangeBand: RangeBandId,
  protectionLevel: ProtectionLevel,
): string {
  return `火力输出${value.toFixed(2)}｜${profileLabel}｜${formatRangeBand(rangeBand)}｜${formatProtectionLevel(protectionLevel)}`;
}
