import type { RuntimeUnit, WeaponIconKind, WeaponProfile } from '@/domain/types';
import { getWeaponById } from '@/domain/weaponRegistry';

export type UnitGlyphKind = WeaponIconKind;

/**
 * Path2D 兵牌图标定义。
 * 所有图标默认枪口朝 +X（向右），配合 ctx.rotate(aimAngle) 指向射击方向。
 * 坐标范围建议 -8 ~ 8，兵牌内部绘制。
 */
const GLYPH_PATHS: Record<UnitGlyphKind, string> = {
  // 步枪：长枪身 + 枪口箭头
  rifle: 'M -7 0 L 7 0 M 7 0 L 2 -4 M 7 0 L 2 4',

  // 半自动步枪：步枪 + 中间横杆
  rifle_bar: 'M -7 0 L 7 0 M 7 0 L 2 -4 M 7 0 L 2 4 M 0 -5 L 0 5',

  // 连发步枪：步枪 + 双横杆
  rifle_multi: 'M -7 0 L 7 0 M 7 0 L 2 -4 M 7 0 L 2 4 M -2 -5 L -2 5 M 2 -5 L 2 5',

  // 冲锋枪：短枪身 + 弹匣 + 枪托 + 枪口
  smg: 'M -5 0 L 5 0 M 5 0 L 7 -1.5 M -4 0 L -6 2.5 M -1 0 L -1 5 M 2 0 L 3.5 4',

  // 机枪：长枪身 + 两脚架 + 枪口
  machine_gun: 'M -7 0 L 7 0 M 7 0 L 3 -3 M 7 0 L 3 3 M -2 0 L -5 6 M 2 0 L 5 6 M -6 6 L 6 6',

  // 迫击炮：炮管 + 底座
  mortar: 'M -5 6 L 2 -6 M -6 6 L 6 6 M 2 -6 L 5 -3',

  // 反坦克：长炮管 + 护盾
  anti_tank: 'M -7 2 L 7 -2 M 7 -2 L 3 -5 M 7 -2 L 4 2 M -6 5 L -2 1',

  // 火炮：炮管 + 炮架
  artillery: 'M -7 3 L 7 -3 M -4 6 L 0 3 M 4 6 L 0 3',

  // 火焰喷射器：罐体 + 软管 + 喷头
  flamethrower: 'M -7 2 L 3 0 M 3 0 C 8 -4 8 4 3 2 M -3 0 L -5 5',

  // 工兵：交叉镐 + 横线
  engineer: 'M -6 -6 L 6 6 M -6 6 L 6 -6 M -5 0 L 5 0',
};

export function resolveGlyphKind(weapon?: WeaponProfile): UnitGlyphKind {
  if (weapon?.iconKind) return weapon.iconKind;
  switch (weapon?.family) {
    case 'bolt_action_rifle': case 'semi_auto_rifle': return 'rifle';
    case 'submachine_gun': return 'smg';
    case 'light_machine_gun': case 'heavy_machine_gun': return 'machine_gun';
    case 'mortar': return 'mortar';
    case 'anti_tank_rifle': case 'anti_tank_gun': case 'rocket_launcher': return 'anti_tank';
    case 'artillery': return 'artillery';
    default: return 'rifle';
  }
}

export function resolveUnitGlyphKind(unit: RuntimeUnit): UnitGlyphKind {
  return resolveGlyphKind(getWeaponById(unit.weaponId));
}

/** 绘制兵牌内武器图标，已预乘屏幕稳定缩放 */
export function drawUnitGlyph(
  ctx: CanvasRenderingContext2D,
  kind: UnitGlyphKind,
): void {
  const d = GLYPH_PATHS[kind] ?? GLYPH_PATHS.rifle;
  const path = new Path2D(d);
  ctx.lineWidth = 1.15;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(35, 40, 38, 0.92)';
  ctx.stroke(path);
}
